import { Prisma, StatusAbsenMurid, StatusPendaftaran } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { handleClassCompletion } from "@/server/services/kelas.service";
import { processAutoBilling } from "@/server/services/pembayaran.service";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";
export const absenMuridRouter = createTRPCRouter({
	getMuridForAbsensi: cabangProtectedProcedure
		.input(z.object({ sesiId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { sesiId } = input;

			// 1. Dapatkan info sesi & kelasId
			const sesi = await db.sesiPertemuanKelas.findUnique({
				where: { id: sesiId },
				select: {
					kelasId: true,
					tanggalWaktu: true,
					kelas: {
						select: {
							kodeKelas: true,
							cabangId: true, // Ambil cabangId
						},
					},
				},
			});

			if (!sesi) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sesi tidak ditemukan",
				});
			}

			if (allowedCabangId && sesi.kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengakses data absensi dari cabang lain.",
				});
			}

			// 2. Dapatkan data absensi yang SUDAH ADA untuk sesi ini
			const existingAbsensi = await db.absensiMurid.findMany({
				where: {
					sesiPertemuanKelasId: sesiId,
				},
				select: {
					id: true,
					muridId: true,
					status: true,
				},
			});

			// 3. Buat Map untuk lookup absensi & Set untuk filter query
			const absensiMap = new Map(
				existingAbsensi.map((a) => [a.muridId, { id: a.id, status: a.status }]),
			);
			const existingMuridIds = existingAbsensi.map((a) => a.muridId);

			// Tanggal sesi ini (WITA) dalam format "YYYY-MM-DD", dipakai untuk
			// membandingkan dengan tanggalMulai (tanggal masuk kelas) tiap siswa.
			const sesiDateStr = formatDateToYYYYMMDD(sesi.tanggalWaktu);

			// 4. Dapatkan semua murid yang terdaftar & aktif di kelas ini (ATAU punya history absensi)
			//    Siswa yang tanggal masuk kelasnya (tanggalMulai) BELUM TERCAPAI pada
			//    tanggal sesi ini TIDAK ditampilkan — kecuali dia sudah punya data
			//    absensi tercatat sebelumnya untuk sesi ini (supaya data lama tidak hilang).
			const pendaftar = await db.pendaftaranKelas.findMany({
				where: {
					kelasId: sesi.kelasId,
					OR: [
						{
							status: {
								in: [
									StatusPendaftaran.AKTIF,
									StatusPendaftaran.TRIAL,
									StatusPendaftaran.OFF_SEMENTARA,
								],
							},
							OR: [
								{ tanggalMulai: null },
								{ tanggalMulai: { lte: sesiDateStr } },
							],
						},
						{
							muridId: { in: existingMuridIds },
						},
					],
				},
				select: {
					id: true,
					status: true,
					murid: {
						select: {
							id: true,
							namaLengkap: true,
						},
					},
				},
				orderBy: {
					murid: { namaLengkap: "asc" },
				},
			});

			// 5. Gabungkan data
			const muridList = pendaftar.map((p) => {
				const absensi = absensiMap.get(p.murid.id);
				return {
					muridId: p.murid.id,
					pendaftaranId: p.id, // Kirim ID pendaftaran ke FE jika perlu, atau pakai di backend
					namaLengkap: p.murid.namaLengkap,
					statusPendaftaran: p.status,
					absensiId: absensi?.id ?? null,
					status: absensi?.status ?? null,
				};
			});

			return {
				sesiInfo: {
					kodeKelas: sesi.kelas.kodeKelas,
					tanggalWaktu: sesi.tanggalWaktu,
				},
				muridList: muridList,
			};
		}),

	createOrUpdateAbsensi: cabangProtectedProcedure
		.input(
			z.object({
				sesiId: z.string(),
				muridId: z.string(),
				status: z.nativeEnum(StatusAbsenMurid),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { sesiId, muridId, status } = input;

			const sesiCheck = await db.sesiPertemuanKelas.findUnique({
				where: { id: sesiId },
				select: {
					kelasId: true,
					kelas: { select: { cabangId: true } },
				},
			});

			if (!sesiCheck) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sesi tidak ditemukan",
				});
			}

			if (allowedCabangId && sesiCheck.kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengubah absensi di cabang lain.",
				});
			}

			// VALIDASI: Pastikan Murid Aktif/Trial ATAU Sudah Punya History Absensi
			const pendaftaran = await db.pendaftaranKelas.findFirst({
				where: {
					muridId: muridId,
					kelasId: sesiCheck.kelasId,
				},
				select: { id: true, status: true },
			});

			if (!pendaftaran) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Murid tidak terdaftar di kelas ini.",
				});
			}

			const isStatusValid =
				pendaftaran.status === StatusPendaftaran.AKTIF ||
				pendaftaran.status === StatusPendaftaran.TRIAL;

			// Guard: Murid OFF_SEMENTARA tidak boleh diubah absensinya oleh guru
			if (pendaftaran.status === StatusPendaftaran.OFF_SEMENTARA) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message:
						"Absensi tidak dapat diubah: murid sedang dalam status OFF Sementara.",
				});
			}

			if (!isStatusValid) {
				// Cek apakah ini update data lama (history)
				const existingAbsen = await db.absensiMurid.findUnique({
					where: {
						muridId_sesiPertemuanKelasId: {
							muridId: muridId,
							sesiPertemuanKelasId: sesiId,
						},
					},
				});

				if (!existingAbsen) {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message:
							"Tidak dapat presensi: Status murid Tidak Aktif dan belum ada riwayat.",
					});
				}
			}

			try {
				// 1. Lakukan Update Absensi Terlebih Dahulu
				const absensi = await db.absensiMurid.upsert({
					where: {
						muridId_sesiPertemuanKelasId: {
							muridId: muridId,
							sesiPertemuanKelasId: sesiId,
						},
					},
					update: { status: status },
					create: {
						muridId: muridId,
						sesiPertemuanKelasId: sesiId,
						status: status,
					},
				});

				// 2. Logic Kalkulasi Tagihan (On-the-Fly)
				const sesi = await db.sesiPertemuanKelas.findUnique({
					where: { id: sesiId },
					select: { kelasId: true, tanggalWaktu: true },
				});

				if (sesi) {
					const pendaftaran = await db.pendaftaranKelas.findFirst({
						where: {
							muridId: muridId,
							kelasId: sesi.kelasId,
						},
					});

					if (pendaftaran) {
						// Hitung sisa pertemuan dan auto-billing
						await processAutoBilling(db, pendaftaran.id, sesi.kelasId);
					}
				}

				return absensi;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					// P2003: MuridId atau SesiId tidak valid
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Data Murid atau Sesi Pertemuan tidak valid.",
						});
					}
				}
				// Rethrow error lain (termasuk error logic billing)
				throw error;
			}
		}),

	selesaikanAbsen: cabangProtectedProcedure
		.input(z.object({ sesiId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const sesi = await db.sesiPertemuanKelas.findUnique({
				where: { id: input.sesiId },
				include: { kelas: true },
			});

			if (!sesi) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sesi tidak ditemukan",
				});
			}

			if (allowedCabangId && sesi.kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menyelesaikan sesi di cabang lain.",
				});
			}

			// Melakukan update dan pengecekan kelulusan dalam satu transaksi
			return await db.$transaction(async (tx) => {
				// 1. Update status sesi
				await tx.sesiPertemuanKelas.update({
					where: { id: input.sesiId },
					data: { isSelesaiAbsen: true },
				});

				// 2. Hitung total sesi yang sudah dijalani oleh kelas ini
				const totalSesi = await tx.sesiPertemuanKelas.count({
					where: { kelasId: sesi.kelasId },
				});

				// 3. Pemicu logika penutupan kelas (Jika sesi >= 24)
				const isFinished = await handleClassCompletion(
					tx,
					sesi.kelasId,
					totalSesi,
				);

				return { success: true, isFinished };
			});
		}),
});
