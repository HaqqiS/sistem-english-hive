import { Prisma, type StatusAbsenMurid } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { createSesiPertemuanCore } from "@/server/services/kelas.service";
import {
	deleteSesiPertemuanSchema,
	serverSesiPertemuanSchema,
	updateSesiPertemuanSchema,
} from "@/types/sesiPertemuan.schema";
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
					status: true,
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
					statusPendaftaran: p.status,
					attendance, // { sesi1Id: "HADIR", sesi2Id: "ALPA", ... }
				};
			});

			return {
				kelasInfo: {
					kodeKelas: kelasInfo.kodeKelas,
					cabangId: kelasInfo.cabangId,
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
			const { kelasId, ruangId, tanggalWaktu } = input;

			// 1. Validasi Kepemilikan Cabang (Router level)
			if (allowedCabangId) {
				const kelas = await db.kelas.findUnique({
					where: { id: kelasId },
					select: { cabangId: true },
				});
				if (kelas && kelas.cabangId !== allowedCabangId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Anda tidak berhak membuat sesi di cabang lain.",
					});
				}
			}

			try {
				const result = await db.$transaction(async (tx) => {
					const { sesi } = await createSesiPertemuanCore(tx, {
						kelasId,
						ruangId,
						tanggalWaktu,
						isTeacher: false, // Admin creation
					});
					return sesi;
				});

				return result;
			} catch (error) {
				if (error instanceof TRPCError) throw error;

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

	updateSesiPertemuan: cabangProtectedProcedure
		.input(updateSesiPertemuanSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// 1. Get Existing Session & Validate Cabang
			const existingSession = await db.sesiPertemuanKelas.findUnique({
				where: { id: input.id },
				include: { kelas: { select: { cabangId: true } } },
			});

			if (!existingSession) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sesi pertemuan tidak ditemukan.",
				});
			}

			if (
				allowedCabangId &&
				existingSession.kelas.cabangId !== allowedCabangId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengubah sesi di cabang ini.",
				});
			}

			// 2. Update
			return await db.sesiPertemuanKelas.update({
				where: { id: input.id },
				data: {
					tanggalWaktu: input.tanggalWaktu,
				},
			});
		}),

	deleteSesiPertemuan: cabangProtectedProcedure
		.input(deleteSesiPertemuanSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// 1. Cari sesi & validasi kepemilikan cabang
			const existingSession = await db.sesiPertemuanKelas.findUnique({
				where: { id: input.id },
				include: { kelas: { select: { cabangId: true } } },
			});

			if (!existingSession) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sesi pertemuan tidak ditemukan.",
				});
			}

			if (
				allowedCabangId &&
				existingSession.kelas.cabangId !== allowedCabangId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus sesi di cabang ini.",
				});
			}

			// 2. Hitung total sesi sebelum dihapus
			const totalSesiSebelumHapus = await db.sesiPertemuanKelas.count({
				where: { kelasId: existingSession.kelasId },
			});

			// 3. Hapus (absensi murid & guru akan cascade delete via Prisma relation)
			const deleted = await db.sesiPertemuanKelas.delete({
				where: { id: input.id },
			});

			// Reverse Trigger: Jika sebelum hapus sudah >= 24, berarti kelas sudah COMPLETED
			// Setelah hapus, total turun < 24 → revert status
			if (totalSesiSebelumHapus >= 24) {
				const kelasLama = await db.kelas.findUnique({
					where: { id: existingSession.kelasId },
					select: { statusKelas: true, cohortId: true, level: true },
				});

				if (kelasLama?.statusKelas === "COMPLETED") {
					// Revert kelas lama → RUNNING
					await db.kelas.update({
						where: { id: existingSession.kelasId },
						data: { statusKelas: "RUNNING" },
					});

					// Revert kelas baru (cohortId sama, level lebih tinggi, sudah RUNNING) → LEVEL_UP
					await db.kelas.updateMany({
						where: {
							cohortId: kelasLama.cohortId,
							level: { gt: kelasLama.level },
							statusKelas: "RUNNING",
						},
						data: { statusKelas: "LEVEL_UP" },
					});
				}
			}

			return deleted;
		}),
});
