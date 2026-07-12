import { Prisma, StatusMurid, StatusPendaftaran } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import {
	RegisterMuridSchema,
	updateStatusMuridSchema,
} from "@/types/murid.type";
import { paginationSchema } from "@/types/pagination.type";
import {
	cabangProtectedProcedure,
	createTRPCRouter,
	publicProcedure,
} from "../trpc";

export const muridRouter = createTRPCRouter({
	getAllPaginated: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				search: z.string().optional(),
				status: z.nativeEnum(StatusMurid).optional(),
				cabangId: z.string().optional(),
				tipeProgram: z.enum(["REGULER", "PRIVAT", "ALL"]).optional(),
				filterNoWA: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { pageIndex, pageSize, search, status, tipeProgram, filterNoWA } =
				input;

			const whereClause: Prisma.MuridWhereInput = {};

			if (search) {
				const isNumber = /^[0-9]+$/.test(search);

				if (isNumber) {
					whereClause.OR = [
						{
							namaLengkap: {
								contains: search,
								mode: "insensitive",
							},
						},
						{
							noWA: {
								contains: search,
							},
						},
					];
				} else {
					whereClause.namaLengkap = {
						contains: search,
						mode: "insensitive",
					};
				}
			}
			if (status) whereClause.statusMurid = status;
			const filterCabangId = allowedCabangId ?? input.cabangId;
			if (filterCabangId) whereClause.cabangId = filterCabangId;
			if (tipeProgram && tipeProgram !== undefined) {
				if (tipeProgram === "REGULER") {
					whereClause.pilihanProgram = {
						contains: "reguler",
						mode: "insensitive",
					};
				} else if (tipeProgram === "PRIVAT") {
					whereClause.pilihanProgram = {
						contains: "privat",
						mode: "insensitive",
					};
				}
			}
			if (filterNoWA) {
				whereClause.noWA = filterNoWA;
			}

			// Dynamic Sorting
			let orderBy: Prisma.MuridOrderByWithRelationInput[] = [
				{ statusMurid: "asc" },
				{ createdAt: "desc" },
			];

			if (input.sorting && input.sorting.length > 0) {
				orderBy = input.sorting.map((sort) => ({
					[sort.id]: sort.desc ? "desc" : "asc",
				}));
			}

			// Gunakan transaction untuk performa (count + findMany paralel)
			const [total, data] = await db.$transaction(
				async (tx) => {
					return Promise.all([
						tx.murid.count({ where: whereClause }),
						tx.murid.findMany({
							skip: pageIndex * pageSize,
							take: pageSize,
							where: whereClause,
							orderBy: orderBy,
							select: {
								id: true,
								namaLengkap: true,
								// email: true,
								gender: true,
								umur: true,
								asalSekolah: true,
								kelasSekolah: true,
								instagram: true, // [NEW]
								noWA: true,
								pilihanProgram: true,
								// jamPulang: true,
								deskripsi: true,
								sumberInfo: true,
								statusMurid: true,
								createdAt: true,
								cabangId: true,
								pendaftaranKelases: {
									where: {
										status: {
											in: [
												StatusPendaftaran.AKTIF,
												StatusPendaftaran.TRIAL,
												StatusPendaftaran.WAITING_LIST,
												StatusPendaftaran.OFF_SEMENTARA,
											],
										},
									},
									include: {
										Kelas: {
											select: {
												kodeKelas: true,
												level: true,
												historyGuruKelases: {
													where: {
														statusGuru: "ACTIVE",
													},
													select: {
														guru: {
															select: {
																name: true,
															},
														},
													},
												},
											},
										},
									},
								},
							},
						}),
					]);
				},
				{ timeout: 20000 },
			);

			const pageCount = Math.ceil(total / pageSize);

			return {
				data,
				pageCount,
				total,
			};
		}),

	getMuridById: cabangProtectedProcedure
		.input(
			z.object({
				id: z.string().cuid(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { db, allowedCabangId } = ctx;

			const murid = await db.murid.findUnique({
				where: { id: input.id },
			});

			if (!murid) return null;

			if (allowedCabangId && murid.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak melihat detail murid dari cabang lain.",
				});
			}

			return murid;
		}),

	getMuridWhereNotRegistered: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const whereClause: Prisma.MuridWhereInput = {
				OR: [
					{ pendaftaranKelases: { none: {} } },
					{ pendaftaranKelases: { every: { status: "NON_AKTIF" } } },
				],
			};

			const filterCabangId = allowedCabangId ?? input?.cabangId;
			if (filterCabangId) whereClause.cabangId = filterCabangId;

			const unregisteredMurid = await db.murid.findMany({
				where: whereClause,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					kelasSekolah: true,
					instagram: true, // [NEW]
					umur: true,
					namaLengkap: true,
					pilihanProgram: true,
					statusMurid: true,
					noWA: true,
					// jamPulang: true,
					createdAt: true,
				},
			});
			return unregisteredMurid;
		}),

	/**
	 * Mengambil semua murid dalam cabang beserta info kelas aktif mereka.
	 * Digunakan untuk form tambah murid ke kelas (mendukung kasus split class).
	 * excludeKelasId: mengecualikan murid yang SUDAH terdaftar aktif di kelas ini.
	 */
	getMuridForKelasEnrollment: cabangProtectedProcedure
		.input(
			z
				.object({
					cabangId: z.string().optional(),
					excludeKelasId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const whereClause: Prisma.MuridWhereInput = {};
			if (filterCabangId) whereClause.cabangId = filterCabangId;

			// Exclude murid yang SUDAH terdaftar aktif di kelas yang dituju
			if (input?.excludeKelasId) {
				whereClause.pendaftaranKelases = {
					none: {
						kelasId: input.excludeKelasId,
						status: { not: "NON_AKTIF" },
					},
				};
			}

			const murids = await db.murid.findMany({
				where: whereClause,
				orderBy: [{ namaLengkap: "asc" }],
				select: {
					id: true,
					namaLengkap: true,
					umur: true,
					kelasSekolah: true,
					statusMurid: true,
					pendaftaranKelases: {
						where: { status: { not: "NON_AKTIF" } },
						select: {
							id: true,
							status: true,
							Kelas: {
								select: {
									id: true,
									kodeKelas: true,
									statusKelas: true,
								},
							},
						},
					},
				},
			});

			// Tandai setiap murid: apakah sudah terdaftar di kelas aktif lain atau belum sama sekali
			return murids.map((m) => {
				const activeEnrollments = m.pendaftaranKelases.filter(
					(p) => p.Kelas.statusKelas !== "COMPLETED",
				);
				return {
					...m,
					isAlreadyEnrolled: activeEnrollments.length > 0,
					activeKelas: activeEnrollments.map((p) => p.Kelas),
				};
			});
		}),

	getMuridNotRegisteredPaginated: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				cabangId: z.string().optional(),
				search: z.string().optional(),
				status: z.nativeEnum(StatusMurid).optional(),
				tipeProgram: z.enum(["REGULER", "PRIVAT", "ALL"]).optional(),
				filterNoWA: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { pageIndex, pageSize } = input;

			// Definisikan where clause agar konsisten untuk count dan findMany
			const whereClause: Prisma.MuridWhereInput = {
				OR: [
					{ pendaftaranKelases: { none: {} } },
					{ pendaftaranKelases: { every: { status: "NON_AKTIF" } } },
				],
			};

			const { search, status, tipeProgram, filterNoWA } = input;

			if (search) {
				const isNumber = /^[0-9]+$/.test(search);

				if (isNumber) {
					whereClause.OR = [
						{
							namaLengkap: {
								contains: search,
								mode: "insensitive",
							},
						},
						{
							noWA: {
								contains: search,
							},
						},
					];
				} else {
					whereClause.namaLengkap = {
						contains: search,
						mode: "insensitive",
					};
				}
			}
			if (status) whereClause.statusMurid = status;
			const filterCabangId = allowedCabangId ?? input.cabangId;
			if (filterCabangId) whereClause.cabangId = filterCabangId;

			if (tipeProgram && tipeProgram !== undefined) {
				if (tipeProgram === "REGULER") {
					whereClause.pilihanProgram = {
						contains: "reguler",
						mode: "insensitive",
					};
				} else if (tipeProgram === "PRIVAT") {
					whereClause.pilihanProgram = {
						contains: "privat",
						mode: "insensitive",
					};
				}
			}
			if (filterNoWA) {
				whereClause.noWA = filterNoWA;
			}

			// Dynamic Sorting
			let orderBy: Prisma.MuridOrderByWithRelationInput[] = [
				{ statusMurid: "asc" },
				{ createdAt: "desc" },
			];

			if (input.sorting && input.sorting.length > 0) {
				orderBy = input.sorting.map((sort) => ({
					[sort.id]: sort.desc ? "desc" : "asc",
				}));
			}

			// Transaction untuk performa (count + query data paralel)
			const [total, data] = await db.$transaction([
				db.murid.count({ where: whereClause }),
				db.murid.findMany({
					skip: pageIndex * pageSize,
					take: pageSize,
					where: whereClause,
					orderBy: orderBy,
					select: {
						id: true,
						kelasSekolah: true,
						umur: true,
						namaLengkap: true,
						pilihanProgram: true,
						statusMurid: true,
						noWA: true,
						instagram: true,
						createdAt: true,
						cabangId: true,
						// email: true,
						gender: true,
						asalSekolah: true,
						// alamat: true,
						deskripsi: true,
						sumberInfo: true,
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

	getKelasWithActiveStudents: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const whereClause: Prisma.KelasWhereInput = {
				pendaftaranKelases: {
					some: {
						status: "AKTIF",
					},
				},
			};

			if (filterCabangId) {
				whereClause.cabangId = filterCabangId;
			}

			const data = await db.kelas.findMany({
				where: whereClause,
				orderBy: { kodeKelas: "asc" },
				select: {
					id: true,
					kodeKelas: true,
					historyGuruKelases: {
						select: {
							guru: {
								select: {
									name: true,
								},
							},
						},
					},
					jadwalKelas: {
						select: {
							id: true,
							hari: true,
							ruang: {
								select: {
									id: true,
									namaRuang: true,
								},
							},
							jamSlotTetap: {
								select: {
									namaSlot: true,
									jamMulai: true,
									jamSelesai: true,
								},
							},
							jamSlotCustom: {
								select: {
									jamMulai: true,
									jamSelesai: true,
								},
							},
						},
					},
					pendaftaranKelases: {
						where: { status: "AKTIF" },
						select: {
							id: true,
							murid: {
								select: {
									id: true,
									namaLengkap: true,
									umur: true,
									kelasSekolah: true,
									noWA: true,
								},
							},
						},
					},
				},
			});

			return data;
		}),

	getForExport: cabangProtectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				status: z.nativeEnum(StatusMurid).optional(),
				cabangId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const whereClause: Prisma.MuridWhereInput = {};
			if (input.search) {
				whereClause.namaLengkap = {
					contains: input.search,
					mode: "insensitive",
				};
			}
			if (input.status) whereClause.statusMurid = input.status;
			const filterCabangId = allowedCabangId ?? input.cabangId;
			if (filterCabangId) whereClause.cabangId = filterCabangId;

			// Ambil data untuk CSV (Pilih field yang relevan untuk marketing/db)
			return await db.murid.findMany({
				where: whereClause,
				orderBy: [{ statusMurid: "asc" }, { createdAt: "desc" }],
				include: {
					cabang: {
						select: { namaCabang: true },
					},
					pendaftaranKelases: {
						where: { status: StatusPendaftaran.AKTIF }, // UPDATED: isAktif is deprecated
						include: {
							Kelas: {
								select: {
									kodeKelas: true,
									jenisKelasRel: { select: { nama: true } },
								},
							},
						},
					},
				},
			});
		}),

	getDuplicateNoWA: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const whereClause: Prisma.MuridWhereInput = {};
			if (filterCabangId) {
				whereClause.cabangId = filterCabangId;
			}

			// Group by noWA and count
			const result = await db.murid.groupBy({
				by: ["noWA"],
				where: whereClause,
				_count: {
					noWA: true,
				},
				having: {
					noWA: {
						_count: {
							gt: 1,
						},
					},
				},
			});

			return result.map((r) => ({
				noWA: r.noWA,
				count: r._count.noWA,
			}));
		}),

	registerMurid: publicProcedure
		.input(RegisterMuridSchema)
		.mutation(async ({ input, ctx }) => {
			const { db } = ctx;
			const { withRegistrationFee: _withRegistrationFee, ...muridData } = input;

			try {
				// Tagihan Registrasi TIDAK dibuat otomatis lagi.
				// Admin menambahkan tagihan Registrasi secara manual lewat halaman
				// "Pembayaran Kelas" di /admin/pembayaran?kelasId=... setelah murid
				// didaftarkan ke kelas.
				return await db.murid.create({
					data: {
						...muridData,
						cabangId: muridData.cabangId,
					},
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Data murid tidak ditemukan.",
						});
					}
				}
				throw error;
			}
		}),

	updateStatusMurid: cabangProtectedProcedure
		.input(updateStatusMuridSchema)
		.mutation(async ({ input, ctx }) => {
			const { db, allowedCabangId } = ctx;

			const existingMurid = await db.murid.findUnique({
				where: { id: input.id },
				select: { cabangId: true },
			});

			if (!existingMurid) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data murid tidak ditemukan.",
				});
			}

			if (allowedCabangId && existingMurid.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengubah murid dari cabang lain.",
				});
			}
			try {
				const updatedMurid = await db.murid.update({
					where: { id: input.id },
					data: {
						statusMurid: input.statusMurid,
					},
				});
				return updatedMurid;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Data murid tidak ditemukan.",
						});
					}
				}
				throw error;
			}
		}),

	updateMurid: cabangProtectedProcedure
		.input(
			RegisterMuridSchema.extend({
				id: z.string().cuid(),
			}).omit({ withRegistrationFee: true }),
		)
		.mutation(async ({ input, ctx }) => {
			const { db, allowedCabangId } = ctx;
			const { id, cabangId, ...data } = input;

			const existingMurid = await db.murid.findUnique({
				where: { id },
				select: { cabangId: true },
			});

			if (!existingMurid) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data murid tidak ditemukan.",
				});
			}

			// 2. Validasi Akses Cabang
			if (allowedCabangId && existingMurid.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengedit murid dari cabang lain.",
				});
			}

			// 3. Validasi tambahan: Jangan biarkan Admin memindahkan siswa ke cabang lain
			// (Manager boleh memindahkan jika perlu)
			if (allowedCabangId && cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak boleh memindahkan siswa ke cabang lain.",
				});
			}

			try {
				const updatedMurid = await db.murid.update({
					where: { id },
					data: {
						...data,
						cabang: {
							connect: { id: cabangId },
						},
					},
				});
				return updatedMurid;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Data murid tidak ditemukan.",
						});
					}
				}
				throw error;
			}
		}),

	deleteMurid: cabangProtectedProcedure
		.input(
			z.object({
				id: z.string().cuid(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { db, allowedCabangId } = ctx;

			const existingMurid = await db.murid.findUnique({
				where: { id: input.id },
				select: { cabangId: true },
			});

			if (!existingMurid) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Murid tidak ditemukan.",
				});
			}

			// 2. Validasi Akses
			if (allowedCabangId && existingMurid.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus murid dari cabang lain.",
				});
			}

			try {
				const deletedMurid = await db.murid.delete({
					where: { id: input.id },
				});
				return deletedMurid;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Murid sudah dihapus atau tidak ditemukan.",
						});
					}
					// P2003: Foreign Key (Jika murid punya data nilai/history yg restrict)
					// Meski schema Anda 'Cascade', tetap baik di-handle jika suatu saat diubah
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "PRECONDITION_FAILED",
							message:
								"Murid tidak bisa dihapus karena memiliki data terkait yang tidak bisa dihapus otomatis.",
						});
					}
				}
				throw error;
			}
		}),
});
