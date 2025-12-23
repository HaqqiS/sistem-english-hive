import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import z from "zod";
import { UserRole } from "@/server/auth/type";
import { getPeriodeGaji } from "@/server/services/gaji.service";
import {
	handleAutoLevelUp,
	handleClassCompletion,
} from "@/server/services/kelas.service";
import {
	serverStartSesiSchema,
	updateAbsensiGuruSchema,
} from "@/types/absenGuru.type";
import { paginationSchema } from "@/types/pagination.type";
import { TIMEZONE_BISNIS } from "@/utils/dateUtils";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";

export const absenGuruRouter = createTRPCRouter({
	getAllAbsensi: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				search: z.string().optional(),
				month: z
					.string()
					.regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM")
					.optional(),
				cabangId: z.string().optional(),
				sorting: z
					.array(
						z.object({
							id: z.string(),
							desc: z.boolean(),
						}),
					)
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { pageIndex, pageSize, month, search } = input;

			const filterCabangId = allowedCabangId ?? input.cabangId;

			const whereClause: Prisma.AbsensiGuruWhereInput = {};

			if (search)
				whereClause.guru = { name: { contains: search, mode: "insensitive" } };

			const sesiFilter: Prisma.SesiPertemuanKelasWhereInput = {};

			if (month && month !== "") {
				const { startDate, endDate } = getPeriodeGaji(month);

				whereClause.sesiPertemuanKelas = {
					tanggalWaktu: {
						gte: startDate,
						lte: endDate,
					},
				};
			}

			if (filterCabangId) sesiFilter.kelas = { cabangId: filterCabangId };
			if (Object.keys(sesiFilter).length > 0)
				whereClause.sesiPertemuanKelas = sesiFilter;

			// Dynamic Sorting
			let orderBy: Prisma.AbsensiGuruOrderByWithRelationInput[] = [
				{
					sesiPertemuanKelas: {
						tanggalWaktu: "desc",
					},
				},
			];

			if (input.sorting && input.sorting.length > 0) {
				orderBy = input.sorting.map((sort) => {
					// Handling nested sorting
					if (sort.id === "namaGuru") {
						return {
							guru: {
								name: sort.desc ? "desc" : "asc",
							},
						};
					}
					if (sort.id === "kelas") {
						return {
							sesiPertemuanKelas: {
								kelas: {
									kodeKelas: sort.desc ? "desc" : "asc",
								},
							},
						};
					}
					if (sort.id === "tanggalWaktu") {
						return {
							sesiPertemuanKelas: {
								tanggalWaktu: sort.desc ? "desc" : "asc",
							},
						};
					}
					if (sort.id === "status") {
						return {
							status: sort.desc ? "desc" : "asc",
						};
					}
					if (sort.id === "isVerified") {
						return {
							isVerified: sort.desc ? "desc" : "asc",
						};
					}
					return {
						[sort.id]: sort.desc ? "desc" : "asc",
					};
				});
			}

			const [total, data] = await db.$transaction([
				db.absensiGuru.count({ where: whereClause }),
				db.absensiGuru.findMany({
					skip: pageIndex * pageSize,
					take: pageSize,
					where: whereClause,
					orderBy: orderBy,
					select: {
						id: true,
						guruId: true,
						guru: {
							select: {
								name: true,
							},
						},
						sesiPertemuanKelasId: true,
						sesiPertemuanKelas: {
							select: {
								tanggalWaktu: true,
								kelas: {
									select: {
										kodeKelas: true,
									},
								},
								ruang: {
									// <-- Pastikan Anda juga menyertakan ruang di sini
									select: {
										namaRuang: true,
									},
								},
							},
						},
						status: true,
						isVerified: true,
						verifiedById: true,
						verifiedBy: {
							select: {
								name: true,
							},
						},
						createdAt: true,
						updatedAt: true,
					},
				}),
			]);

			const pageCount = Math.ceil(total / pageSize);
			return {
				data,
				pageCount,
				total,
			};
		}),

	getHistoryByGuruId: cabangProtectedProcedure
		.input(
			z.object({
				guruId: z.string().cuid(),
				/** Input bulan pembayaran (Gaji Bulan X) dalam format "YYYY-MM" */
				month: z.string().regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM"),
				cabangId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;
			const { guruId, month, cabangId } = input;

			const filterCabangId = allowedCabangId ?? cabangId;

			if (
				session.user.role !== UserRole.ADMIN &&
				session.user.role !== UserRole.MANAGER
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Hanya Admin yang dapat mengakses history penggajian.",
				});
			}

			// 1. Security Check: Pastikan Guru yang diminta ada di cabang yang diizinkan
			if (allowedCabangId) {
				const guru = await db.user.findUnique({
					where: { id: guruId },
					select: { cabangId: true },
				});

				if (!guru) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Guru tidak ditemukan.",
					});
				}

				if (guru.cabangId !== allowedCabangId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Anda tidak berhak melihat data guru dari cabang lain.",
					});
				}
			}

			// 2. Gunakan Service untuk mendapatkan range tanggal (26 prev - 25 curr)
			const { startDate, endDate } = getPeriodeGaji(month);

			// 2. Query absensi guru berdasarkan range tanggal tersebut
			const history = await db.absensiGuru.findMany({
				where: {
					guruId: guruId,
					isVerified: true,
					sesiPertemuanKelas: {
						tanggalWaktu: {
							gte: startDate,
							lte: endDate,
						},
						...(filterCabangId
							? {
									kelas: {
										cabangId: filterCabangId,
									},
								}
							: {}),
					},
				},
				select: {
					id: true,
					status: true,
					isVerified: true,
					sesiPertemuanKelas: {
						select: {
							tanggalWaktu: true,
							kelas: {
								select: {
									kodeKelas: true,
									// jenisKelas: true, // Legacy
									// jenisKelas: true, // Legacy
									jenisKelasRel: { select: { nama: true } },
									// tipe: true, // Removed
								},
							},
							ruang: {
								select: {
									namaRuang: true,
								},
							},
						},
					},
				},
				orderBy: {
					sesiPertemuanKelas: {
						tanggalWaktu: "desc",
					},
				},
			});

			return history;
		}),

	getForExport: cabangProtectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				month: z
					.string()
					.regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM")
					.optional(),
				cabangId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { month, search } = input;

			const filterCabangId = allowedCabangId ?? input.cabangId;

			const whereClause: Prisma.AbsensiGuruWhereInput = {};

			if (search)
				whereClause.guru = { name: { contains: search, mode: "insensitive" } };

			const sesiFilter: Prisma.SesiPertemuanKelasWhereInput = {};

			if (month && month !== "") {
				const { startDate, endDate } = getPeriodeGaji(month);

				sesiFilter.tanggalWaktu = {
					gte: startDate,
					lte: endDate,
				};
			}

			if (filterCabangId) sesiFilter.kelas = { cabangId: filterCabangId };

			if (Object.keys(sesiFilter).length > 0)
				whereClause.sesiPertemuanKelas = sesiFilter;

			// Ambil SEMUA data (Tanpa Pagination)
			return await db.absensiGuru.findMany({
				where: whereClause,
				orderBy: { sesiPertemuanKelas: { tanggalWaktu: "desc" } },
				select: {
					guru: { select: { name: true } },
					status: true,
					isVerified: true,
					sesiPertemuanKelas: {
						select: {
							tanggalWaktu: true,
							kelas: {
								select: {
									kodeKelas: true,
									cabang: { select: { namaCabang: true } },
								},
							},
							ruang: { select: { namaRuang: true } },
						},
					},
				},
			});
		}),

	/**
	 * Dipanggil saat guru mengklik "Mulai Sesi".
	 * Membuat SesiPertemuanKelas (realisasi) DAN AbsensiGuru (catatan hadir guru).
	 * Mengembalikan ID SesiPertemuanKelas yang baru dibuat untuk redirect.
	 */
	createSesiAndAbsensi: cabangProtectedProcedure
		.input(serverStartSesiSchema) // <-- Gunakan skema baru
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;
			const guruId = session.user.id;
			const { jadwalKelasId, status, overrideRuangId } = input;

			try {
				// 1. Dapatkan data jadwal & kelas
				const jadwal = await db.jadwalKelas.findUnique({
					where: { id: jadwalKelasId },
					select: {
						kelasId: true,
						ruangId: true,
						kelas: {
							select: {
								id: true,
								level: true,
								cohortId: true,
								// jenisKelas: true,
								// jenisKelas: true,
								jenisKelasRel: { select: { nama: true } },
								// tipe: true,
								grup: true,
								hargaKelas: true,
								deskripsi: true,
								kodeKelas: true,
								cabangId: true,
							},
						},
					},
				});

				if (!jadwal)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Jadwal tidak ditemukan",
					});

				if (allowedCabangId && jadwal.kelas.cabangId !== allowedCabangId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message:
							"Anda tidak berhak memulai sesi untuk kelas di cabang lain.",
					});
				}

				// 2. Tentukan ruangId yang akan dipakai
				// Prioritaskan override, jika tidak ada, pakai ruang dari jadwal
				const finalRuangId = overrideRuangId ?? jadwal.ruangId;
				// 3. Tentukan tanggalWaktu (REALITA)
				// Gunakan Waktu WITA saat ini
				const tanggalWaktuSesi = dayjs().tz(TIMEZONE_BISNIS).toDate();

				// 4. Transaction: Buat Sesi -> Cek Level Up -> Cek Finish
				const result = await db.$transaction(async (tx) => {
					// 4a. Buat SesiPertemuanKelas (Realisasi)
					const newSesi = await tx.sesiPertemuanKelas.create({
						data: {
							kelasId: jadwal.kelasId,
							ruangId: finalRuangId,
							tanggalWaktu: tanggalWaktuSesi,
							jadwalKelasId: jadwalKelasId,
						},
						select: { id: true },
					});

					// 4b. Buat AbsensiGuru
					await tx.absensiGuru.create({
						data: {
							guruId,
							sesiPertemuanKelasId: newSesi.id,
							status,
							isVerified: false,
						},
					});

					// Hitung Total Sesi (Termasuk yang baru dibuat)
					const totalSesi = await tx.sesiPertemuanKelas.count({
						where: { kelasId: jadwal.kelasId },
					});

					// === SERVICE CALL: LEVEL UP (Trigger di Sesi 20) ===
					if (totalSesi === 20) {
						await handleAutoLevelUp({ tx, jadwal });
					}

					// === SERVICE CALL: CLASS COMPLETION (Trigger di Sesi 24) ===
					const isFinished = await handleClassCompletion(
						tx,
						jadwal.kelasId,
						totalSesi,
					);

					return {
						newSesiId: newSesi.id,
						absensiId: null,
						isFinished: isFinished,
					};
				});

				return result;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					// P2003: Referensi Ruang/Kelas tidak valid saat create
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Ruang atau Kelas tidak valid saat membuat sesi.",
						});
					}
				}
				throw error;
			}
		}),

	verifyAbsensi: cabangProtectedProcedure
		.input(
			z.object({
				absensiId: z.string(),
				isVerified: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;
			if (
				session.user.role !== UserRole.ADMIN &&
				session.user.role !== UserRole.MANAGER
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Hanya admin/manager yang dapat memverifikasi absensi.",
				});
			}

			const existingAbsensi = await db.absensiGuru.findUnique({
				where: { id: input.absensiId },
				include: {
					sesiPertemuanKelas: {
						include: {
							kelas: { select: { cabangId: true } }, // Ambil cabangId
						},
					},
				},
			});

			if (!existingAbsensi) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Absensi tidak ditemukan.",
				});
			}

			// 3. Security Filter (Cabang Check)
			const dataCabangId = existingAbsensi.sesiPertemuanKelas.kelas.cabangId;

			if (allowedCabangId && dataCabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak memverifikasi absensi cabang lain.",
				});
			}

			try {
				await db.absensiGuru.update({
					where: {
						id: input.absensiId,
					},
					data: {
						verifiedById: session.user.id,
						isVerified: input.isVerified,
					},
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Absensi tidak ditemukan.",
						});
					}
				}
				throw error;
			}
		}),

	updateAbsenGuru: cabangProtectedProcedure
		.input(
			updateAbsensiGuruSchema.extend({
				absensiId: z.string().cuid("ID absensi tidak valid"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;
			const { status, isVerified, guruId, absensiId } = input;

			if (
				isVerified &&
				(session.user.role as UserRole) !== UserRole.ADMIN &&
				(session.user.role as UserRole) !== UserRole.MANAGER
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Hanya admin/manager yang dapat memverifikasi absensi.",
				});
			}

			const existingAbsensi = await db.absensiGuru.findUnique({
				where: { id: absensiId },
				include: {
					sesiPertemuanKelas: {
						include: {
							kelas: { select: { cabangId: true } },
						},
					},
				},
			});

			if (!existingAbsensi) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Absensi tidak ditemukan.",
				});
			}

			const dataCabangId = existingAbsensi.sesiPertemuanKelas.kelas.cabangId;

			if (allowedCabangId && dataCabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengubah absensi cabang lain.",
				});
			}

			try {
				const updatedAbsensi = await db.absensiGuru.update({
					where: { id: absensiId },
					data: {
						status: status,
						isVerified: isVerified,
						guruId: guruId,
						verifiedById: isVerified ? session.user.id : null,
					},
				});

				return updatedAbsensi;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Absensi tidak ditemukan.",
						});
					}
					// P2002: Jika guru diganti, cek apakah guru baru sudah absen di sesi yang sama?
					if (error.code === "P2002") {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Guru yang dipilih sudah memiliki absensi di sesi ini.",
						});
					}
					// P2003: Guru ID baru tidak valid
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Guru pengganti tidak valid.",
						});
					}
				}
				throw error;
			}
		}),

	deleteAbsenGuru: cabangProtectedProcedure
		.input(z.object({ id: z.string().cuid() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { id } = input;

			const existingAbsensi = await db.absensiGuru.findUnique({
				where: { id },
				include: {
					sesiPertemuanKelas: {
						include: {
							kelas: { select: { cabangId: true } },
						},
					},
				},
			});

			if (!existingAbsensi) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Absensi tidak ditemukan.",
				});
			}

			// 2. Security Filter
			if (
				allowedCabangId &&
				existingAbsensi.sesiPertemuanKelas.kelas.cabangId !== allowedCabangId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus absensi cabang lain.",
				});
			}

			try {
				await db.absensiGuru.delete({
					where: { id },
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Absensi tidak ditemukan atau sudah dihapus.",
						});
					}
				}
				throw error;
			}
		}),
});
