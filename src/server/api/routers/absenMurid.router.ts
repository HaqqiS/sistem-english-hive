import {
	Prisma,
	StatusAbsenMurid,
	StatusPembayaran,
	StatusPendaftaran,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import {
	BATAS_SISA_UNTUK_TAGIHAN,
	JUMLAH_PERTEMUAN_PER_BLOK,
} from "@/constants/pembayaran";
import {
	calculateSisaPertemuan,
	generateTagihan,
} from "@/server/services/pembayaran.service";
import dayjs from "@/utils/dateUtils";
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

			// 2. Dapatkan semua murid yang terdaftar & aktif di kelas ini
			const pendaftar = await db.pendaftaranKelas.findMany({
				where: {
					kelasId: sesi.kelasId,
				},
				select: {
					id: true,
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

			// 3. Dapatkan data absensi yang SUDAH ADA untuk sesi ini
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

			// 4. Buat Map untuk lookup absensi
			const absensiMap = new Map(
				existingAbsensi.map((a) => [a.muridId, { id: a.id, status: a.status }]),
			);

			// 5. Gabungkan data
			const muridList = pendaftar.map((p) => {
				const absensi = absensiMap.get(p.murid.id);
				return {
					muridId: p.murid.id,
					pendaftaranId: p.id, // Kirim ID pendaftaran ke FE jika perlu, atau pakai di backend
					namaLengkap: p.murid.namaLengkap,
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
							status: StatusPendaftaran.AKTIF, // UPDATED: isAktif is deprecated
						},
					});

					if (pendaftaran) {
						// Hitung sisa pertemuan
						const billingStatus = await calculateSisaPertemuan(
							db,
							pendaftaran.id,
						);

						// === LOGIC AUTO-BILLING ===
						if (billingStatus.needNewBill) {
							// [BARU] CIRCUIT BREAKER: Cek apakah kelas sudah di fase akhir (Sesi 20++)?
							const jumlahSesiBerlalu = await db.sesiPertemuanKelas.count({
								where: { kelasId: sesi.kelasId },
							});

							// Jika kelas sudah mencapai sesi 20 (Trigger Level Up) atau lebih,
							// JANGAN buat tagihan lagi untuk Level ini.
							// Tagihan selanjutnya akan dihandle oleh pendaftaran di Level Baru.
							if (jumlahSesiBerlalu >= 20) {
								console.log(
									`[AUTO-BILL] Skipped. Kelas sudah di Sesi ${jumlahSesiBerlalu} (Fase Level Up).`,
								);
								return absensi;
							}

							// Guard lama: Max 3 tagihan per level (untuk kasus normal)
							if (billingStatus.nextBillPembayaranKe > 3) {
								console.log(
									`[AUTO-BILL] Skipped. Tagihan ke-${billingStatus.nextBillPembayaranKe} melebihi batas per level.`,
								);
								return absensi;
							}

							// Buat Tagihan Baru
							const harga = billingStatus.hargaPerSesi ?? 0;
							const paket =
								billingStatus.paketPertemuan ?? JUMLAH_PERTEMUAN_PER_BLOK;
							const totalTagihan = harga * paket;
							const jatuhTempo = dayjs().add(7, "day").toDate();

							await generateTagihan(db, {
								pendaftaranId: pendaftaran.id,
								pembayaranKe: billingStatus.nextBillPembayaranKe,
								jumlahBayar: totalTagihan,
								jatuhTempo: jatuhTempo,
								note: `Auto-Generate: Kuota sisa ${billingStatus.sisaPertemuan}. Paket ${paket} Sesi berikutnya.`,
							});
						} else {
							// [CLEANUP] Jika revisi absen membuat kuota kembali aman
							if (billingStatus.sisaPertemuan > BATAS_SISA_UNTUK_TAGIHAN) {
								const autoBillToDelete = await db.pembayaran.findFirst({
									where: {
										pendaftaranKelasId: pendaftaran.id,
										statusBayar: {
											in: [
												StatusPembayaran.BELUM_LUNAS,
												StatusPembayaran.PENDING,
											],
										},
										note: { contains: "Auto-Generate" }, // Hanya hapus yg auto
									},
									orderBy: { createdAt: "desc" },
								});

								if (autoBillToDelete) {
									await db.pembayaran.delete({
										where: { id: autoBillToDelete.id },
									});
								}
							}
						}
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
});
