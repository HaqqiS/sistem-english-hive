import { Prisma, type StatusAbsenMurid } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { serverSesiPertemuanSchema } from "@/types/sesiPertemuan.schema";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";

export const sesiPertemuanRouter = createTRPCRouter({
	getById: cabangProtectedProcedure
		.input(z.object({ id: z.string(), cabangId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// 1. Security Filter
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const whereClause: Prisma.SesiPertemuanKelasWhereInput = {};
			whereClause.id = input.id;
			if (filterCabangId) {
				whereClause.kelas = {
					cabangId: filterCabangId,
				};
			}

			const sesiPertemuan = await db.sesiPertemuanKelas.findFirst({
				where: whereClause,
				select: {
					id: true,
					kelasId: true,
					kelas: {
						select: {
							kodeKelas: true,
						},
					},
					// ruangId: true,
					ruang: { select: { namaRuang: true } },
					tanggalWaktu: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			return sesiPertemuan;
		}),

	getSesiSummaryByKelasId: cabangProtectedProcedure
		.input(z.object({ kelasId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { kelasId } = input;

			// 1. Dapatkan Info Kelas dan Guru Aktif
			const kelasInfo = await db.kelas.findUnique({
				where: { id: kelasId },
				select: {
					kodeKelas: true,
					cabangId: true,
					historyGuruKelases: {
						where: { statusGuru: "ACTIVE" },
						select: {
							guru: { select: { name: true } },
						},
						take: 1,
					},
				},
			});

			if (!kelasInfo) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Kelas tidak ditemukan.",
				});
			}

			if (allowedCabangId && kelasInfo.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Anda tidak berhak melihat data sesi kelas dari cabang lain.",
				});
			}

			// 2. Dapatkan Daftar Siswa yg pernah terdaftar di kelas ini
			const students = await db.pendaftaranKelas.findMany({
				where: {
					kelasId: kelasId,
				},
				select: {
					murid: {
						select: { id: true, namaLengkap: true },
					},
				},
				orderBy: { murid: { namaLengkap: "asc" } },
			});

			// 3. Dapatkan Daftar Sesi (Kolom)
			const sessions = await db.sesiPertemuanKelas.findMany({
				where: { kelasId: kelasId },
				select: {
					id: true,
					tanggalWaktu: true,
					absensiGurus: {
						select: {
							guru: { select: { name: true } },
						},
						take: 1,
					},
				},
				orderBy: { tanggalWaktu: "asc" },
			});

			// 4. Dapatkan SEMUA data absensi murid untuk kelas ini
			const allAbsensi = await db.absensiMurid.findMany({
				where: {
					sesiPertemuanKelas: {
						kelasId: kelasId,
					},
				},
				select: {
					muridId: true,
					sesiPertemuanKelasId: true,
					status: true,
				},
			});

			// 5. Olah data untuk Front-end
			// Buat Peta Absensi: Map<muridId, Map<sesiId, status>>
			const absensiMap = new Map<string, Map<string, StatusAbsenMurid>>();
			for (const absen of allAbsensi) {
				if (!absensiMap.has(absen.muridId)) {
					absensiMap.set(absen.muridId, new Map());
				}
				absensiMap
					.get(absen.muridId)
					?.set(absen.sesiPertemuanKelasId, absen.status);
			}

			// Siapkan data kolom
			const columnData = sessions.map((sesi, index) => ({
				sesiId: sesi.id,
				tanggal: sesi.tanggalWaktu,
				pertemuanKe: `Pertemuan ${index + 1}`,
				pengajar: sesi.absensiGurus[0]?.guru.name ?? "N/A",
			}));

			// Siapkan data baris
			const rowData = students.map((p) => {
				const studentId = p.murid.id;
				const studentAbsenMap = absensiMap.get(studentId);

				// Buat absensi untuk setiap sesi
				const attendance = sessions.reduce(
					(acc, sesi) => {
						acc[sesi.id] = studentAbsenMap?.get(sesi.id) ?? null;
						return acc;
					},
					{} as Record<string, StatusAbsenMurid | null>,
				);

				return {
					studentId: studentId,
					namaSiswa: p.murid.namaLengkap,
					attendance, // { sesi1Id: "HADIR", sesi2Id: "ALPA", ... }
				};
			});

			return {
				kelasInfo: {
					kodeKelas: kelasInfo.kodeKelas,
					guruAktif: kelasInfo.historyGuruKelases[0]?.guru.name ?? "Belum ada",
				},
				columnData, // Daftar kolom (sesi)
				rowData, // Daftar baris (siswa)
			};
		}),

	createSesiPertemuan: cabangProtectedProcedure
		.input(serverSesiPertemuanSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// 1. Validasi Kepemilikan & Konsistensi
			const [kelas, ruang] = await Promise.all([
				db.kelas.findUnique({
					where: { id: input.kelasId },
					select: { cabangId: true, kodeKelas: true },
				}),
				db.ruang.findUnique({
					where: { id: input.ruangId },
					select: { cabangId: true, namaRuang: true },
				}),
			]);

			if (!kelas || !ruang) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Kelas atau Ruang tidak ditemukan.",
				});
			}

			if (kelas.cabangId !== ruang.cabangId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Konflik Cabang: Kelas ${kelas.kodeKelas} dan Ruang ${ruang.namaRuang} berbeda cabang.`,
				});
			}

			if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak membuat sesi di cabang lain.",
				});
			}

			try {
				return await db.sesiPertemuanKelas.create({
					data: {
						kelasId: input.kelasId,
						ruangId: input.ruangId,
						tanggalWaktu: input.tanggalWaktu,
					},
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					// P2003: Foreign Key (Kelas atau Ruang tidak valid)
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message:
								"Gagal membuat sesi: Kelas atau Ruang yang dipilih tidak valid.",
						});
					}
				}
				throw error;
			}
		}),
});
