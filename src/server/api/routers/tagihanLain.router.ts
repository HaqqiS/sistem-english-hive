import { KategoriTagihan, type Prisma, StatusPembayaran } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cabangProtectedProcedure, createTRPCRouter } from "@/server/api/trpc";
import { paginationSchema } from "@/types/pagination.type";

export const tagihanLainRouter = createTRPCRouter({
	// 1. Get All for a Student
	getAllByMurid: cabangProtectedProcedure
		.input(z.object({ muridId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const whereClause: Prisma.TagihanLainWhereInput = {
				muridId: input.muridId,
			};

			if (allowedCabangId) {
				whereClause.murid = {
					cabangId: allowedCabangId,
				};
			}

			return db.tagihanLain.findMany({
				where: whereClause,
				orderBy: {
					createdAt: "desc",
				},
				include: {
					murid: {
						select: {
							namaLengkap: true,
							noWA: true,
							cabang: { select: { namaCabang: true } },
						},
					},
				},
			});
		}),

	// 6. Get All Paginated (Global View for Admin/Manager)
	getAllPaginated: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				status: z.nativeEnum(StatusPembayaran).optional(),
				muridId: z.string().optional(),
				search: z.string().optional(),
				cabangId: z.string().optional(),
				kategori: z.nativeEnum(KategoriTagihan).optional(),
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
			const { pageIndex, pageSize } = input;

			const filterCabangId = allowedCabangId ?? input.cabangId;

			const whereClause: Prisma.TagihanLainWhereInput = {};

			// Filter by Branch
			if (filterCabangId) {
				whereClause.murid = {
					cabangId: filterCabangId,
				};
			}

			// Filter by Murid
			if (input.muridId) {
				whereClause.muridId = input.muridId;
			}

			// Filter by Status
			if (input.status) {
				whereClause.status = input.status;
			}

			// Filter by Kategori
			if (input.kategori) {
				whereClause.kategori = input.kategori;
			}

			// Search (by Judul or Murid Name)
			if (input.search) {
				whereClause.OR = [
					{
						judul: {
							contains: input.search,
							mode: "insensitive",
						},
					},
					{
						murid: {
							namaLengkap: {
								contains: input.search,
								mode: "insensitive",
							},
						},
					},
				];
			}

			// Dynamic Sorting
			let orderBy: Prisma.TagihanLainOrderByWithRelationInput[] = [
				{ createdAt: "desc" },
			];

			if (input.sorting && input.sorting.length > 0) {
				orderBy = input.sorting.map((sort) => {
					if (sort.id === "namaMurid") {
						return {
							murid: {
								namaLengkap: sort.desc ? "desc" : "asc",
							},
						};
					}
					return {
						[sort.id]: sort.desc ? "desc" : "asc",
					};
				});
			}

			// Transaction: Count + FindMany
			const [total, data] = await db.$transaction([
				db.tagihanLain.count({ where: whereClause }),
				db.tagihanLain.findMany({
					skip: pageIndex * pageSize,
					take: pageSize,
					where: whereClause,
					orderBy: orderBy,
					include: {
						murid: {
							select: {
								namaLengkap: true,
								noWA: true,
								cabang: { select: { namaCabang: true } },
							},
						},
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

	// 2. Create Manually
	create: cabangProtectedProcedure
		.input(
			z.object({
				muridId: z.string(),
				kategori: z.nativeEnum(KategoriTagihan),
				judul: z.string(),
				jumlah: z.number(),
				deskripsi: z.string().optional(),
				status: z.nativeEnum(StatusPembayaran).default("BELUM_LUNAS"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// Check if murid belongs to allowed branch
			if (allowedCabangId) {
				const murid = await db.murid.findUnique({
					where: { id: input.muridId },
					select: { cabangId: true },
				});

				if (!murid) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Murid tidak ditemukan",
					});
				}

				if (murid.cabangId !== allowedCabangId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message:
							"Anda tidak berhak membuat tagihan untuk murid cabang lain",
					});
				}
			}

			return db.tagihanLain.create({
				data: {
					muridId: input.muridId,
					kategori: input.kategori,
					judul: input.judul,
					jumlah: input.jumlah,
					deskripsi: input.deskripsi,
					status: input.status,
				},
			});
		}),

	// 3. Mark as Paid
	markAsPaid: cabangProtectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const existing = await db.tagihanLain.findUnique({
				where: { id: input.id },
				include: { murid: { select: { cabangId: true } } },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tagihan tidak ditemukan",
				});
			}

			if (allowedCabangId && existing.murid.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengubah data cabang lain",
				});
			}

			return db.tagihanLain.update({
				where: { id: input.id },
				data: {
					status: "LUNAS",
				},
			});
		}),

	// 4. Update (Edit)
	update: cabangProtectedProcedure
		.input(
			z.object({
				id: z.string(),
				judul: z.string().optional(),
				jumlah: z.number().optional(),
				deskripsi: z.string().optional(),
				status: z.nativeEnum(StatusPembayaran).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const existing = await db.tagihanLain.findUnique({
				where: { id: input.id },
				include: { murid: { select: { cabangId: true } } },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tagihan tidak ditemukan",
				});
			}

			if (allowedCabangId && existing.murid.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengubah data cabang lain",
				});
			}

			return db.tagihanLain.update({
				where: { id: input.id },
				data: {
					judul: input.judul,
					jumlah: input.jumlah,
					deskripsi: input.deskripsi,
					status: input.status,
				},
			});
		}),

	// 5. Delete
	delete: cabangProtectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const existing = await db.tagihanLain.findUnique({
				where: { id: input.id },
				include: { murid: { select: { cabangId: true } } },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tagihan tidak ditemukan",
				});
			}

			if (allowedCabangId && existing.murid.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus data cabang lain",
				});
			}

			return db.tagihanLain.delete({
				where: { id: input.id },
			});
		}),
});
