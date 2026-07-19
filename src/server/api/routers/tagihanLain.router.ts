import {
	KategoriTagihan,
	type Prisma,
	type PrismaClient,
	StatusPembayaran,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cabangProtectedProcedure, createTRPCRouter } from "@/server/api/trpc";
import { paginationSchema } from "@/types/pagination.type";
import {
	createTagihanLainSchema,
	updateTagihanLainSchema,
} from "@/types/tagihanLain.type";

export const tagihanLainRouter = createTRPCRouter({
	// Get All for a Student
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
							cabang: {
								select: {
									namaCabang: true,
									noRekening: true,
									bank: true,
									atasNama: true,
								},
							},
						},
					},
					kelas: { select: { kodeKelas: true, hargaKelas: true } },
					verifiedBy: { select: { name: true } },
				},
			});
		}),

	// Get All Paginated (Global View for Admin/Manager)
	getAllBukuPaginated: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				status: z.nativeEnum(StatusPembayaran).optional(),
				muridId: z.string().optional(),
				search: z.string().optional(),
				deskripsi: z.string().optional(),
				cabangId: z.string().optional(),
				kelasId: z.string().optional(),
				jenisKelasNama: z.string().optional(),
				level: z.number().optional(),
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
			return getPaginatedTagihan(ctx.db, ctx.allowedCabangId, {
				...input,
				kategori: KategoriTagihan.BUKU,
			});
		}),

	getAllRegistrasiPaginated: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				status: z.nativeEnum(StatusPembayaran).optional(),
				muridId: z.string().optional(),
				search: z.string().optional(),
				deskripsi: z.string().optional(),
				cabangId: z.string().optional(),
				kelasId: z.string().optional(),
				jenisKelasNama: z.string().optional(),
				level: z.number().optional(),
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
			return getPaginatedTagihan(ctx.db, ctx.allowedCabangId, {
				...input,
				kategori: KategoriTagihan.REGISTRASI,
			});
		}),

	getAllLainnyaPaginated: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				status: z.nativeEnum(StatusPembayaran).optional(),
				muridId: z.string().optional(),
				search: z.string().optional(),
				deskripsi: z.string().optional(),
				cabangId: z.string().optional(),
				kelasId: z.string().optional(),
				jenisKelasNama: z.string().optional(),
				level: z.number().optional(),
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
			return getPaginatedTagihan(ctx.db, ctx.allowedCabangId, {
				...input,
				kategori: KategoriTagihan.LAINNYA,
			});
		}),

	// Get All Belum Lunas (Similar to Tagihan Jatuh Tempo)
	getAllBelumLunas: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				cabangId: z.string().optional(),
				kategori: z.nativeEnum(KategoriTagihan).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			return getPaginatedTagihan(ctx.db, ctx.allowedCabangId, {
				...input,
				status: StatusPembayaran.BELUM_LUNAS,
			});
		}),

	// Create Manually
	create: cabangProtectedProcedure
		.input(createTagihanLainSchema)
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
					kelasId: input.kelasId,
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
					tanggalBayar: new Date(),
					verifiedById: ctx.session.user.id,
				},
			});
		}),

	// Tandai status "sudah diingatkan" / "belum diingatkan" via WA (per tagihan)
	toggleDiingatkan: cabangProtectedProcedure
		.input(z.object({ id: z.string(), value: z.boolean() }))
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
				data: { sudahDiingatkan: input.value },
			});
		}),

	// 4. Update (Edit)
	update: cabangProtectedProcedure
		.input(updateTagihanLainSchema)
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
					kelasId: input.kelasId,
					// Bersihkan audit trail jika status dikembalikan ke belum lunas
					...(input.status === "BELUM_LUNAS" || input.status === "PENDING"
						? { tanggalBayar: null, verifiedById: null }
						: {}),
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

	// 5b. Delete Sekaligus Banyak (BULK)
	deleteMany: cabangProtectedProcedure
		.input(z.object({ ids: z.array(z.string()).min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const existing = await db.tagihanLain.findMany({
				where: { id: { in: input.ids } },
				include: { murid: { select: { cabangId: true } } },
			});

			if (existing.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tagihan tidak ditemukan",
				});
			}

			const hasForeignCabang = existing.some(
				(t) => allowedCabangId && t.murid.cabangId !== allowedCabangId,
			);
			if (hasForeignCabang) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus data cabang lain",
				});
			}

			const validIds = existing.map((t) => t.id);

			const result = await db.tagihanLain.deleteMany({
				where: { id: { in: validIds } },
			});

			return { count: result.count };
		}),

	// 6. Get For Export (No Pagination)
	getForExport: cabangProtectedProcedure
		.input(
			z.object({
				kategori: z.nativeEnum(KategoriTagihan),
				status: z.nativeEnum(StatusPembayaran).optional(),
				muridId: z.string().optional(),
				search: z.string().optional(),
				deskripsi: z.string().optional(),
				cabangId: z.string().optional(),
				kelasId: z.string().optional(),
				jenisKelasNama: z.string().optional(),
				level: z.number().optional(),
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
			const filterCabangId = allowedCabangId ?? input.cabangId;

			const whereClause = createTagihanWhereClause({
				cabangId: filterCabangId,
				muridId: input.muridId,
				status: input.status,
				deskripsi: input.deskripsi,
				kategori: input.kategori,
				search: input.search,
				kelasId: input.kelasId,
				jenisKelasNama: input.jenisKelasNama,
				level: input.level,
			});

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

			return db.tagihanLain.findMany({
				where: whereClause,
				orderBy: orderBy,
				include: {
					murid: {
						select: {
							namaLengkap: true,
							noWA: true,
							cabang: {
								select: {
									namaCabang: true,
									noRekening: true,
									bank: true,
									atasNama: true,
								},
							},
						},
					},
					kelas: { select: { kodeKelas: true, hargaKelas: true } },
					verifiedBy: { select: { name: true } },
				},
			});
		}),
});

async function getPaginatedTagihan(
	db: PrismaClient,
	allowedCabangId: string | undefined | null,
	input: {
		pageIndex: number;
		pageSize: number;
		status?: StatusPembayaran;
		deskripsi?: string;
		muridId?: string;
		search?: string;
		cabangId?: string;
		kelasId?: string;
		jenisKelasNama?: string;
		level?: number;
		kategori?: KategoriTagihan;
		sorting?: { id: string; desc: boolean }[];
	},
) {
	const { pageIndex, pageSize } = input;

	const filterCabangId = allowedCabangId ?? input.cabangId;

	const whereClause = createTagihanWhereClause({
		cabangId: filterCabangId,
		muridId: input.muridId,
		status: input.status,
		deskripsi: input.deskripsi,
		kategori: input.kategori,
		search: input.search,
		kelasId: input.kelasId,
		jenisKelasNama: input.jenisKelasNama,
		level: input.level,
	});

	// Dynamic Sorting
	let orderBy: Prisma.TagihanLainOrderByWithRelationInput[] = [
		{ createdAt: "desc" },
		{ status: "asc" },
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
						cabang: {
							select: {
								namaCabang: true,
								noRekening: true,
								bank: true,
								atasNama: true,
							},
						},
					},
				},
				kelas: { select: { kodeKelas: true, hargaKelas: true } },
				verifiedBy: { select: { name: true } },
			},
		}),
	]);

	const pageCount = Math.ceil(total / pageSize);

	return {
		data,
		pageCount,
		total,
	};
}

function createTagihanWhereClause(input: {
	cabangId?: string | null;
	muridId?: string;
	status?: StatusPembayaran;
	deskripsi?: string;
	kategori?: KategoriTagihan;
	search?: string;
	kelasId?: string;
	jenisKelasNama?: string;
	level?: number;
}) {
	const whereClause: Prisma.TagihanLainWhereInput = {};

	// Filter by Branch
	if (input.cabangId) {
		whereClause.murid = {
			cabangId: input.cabangId,
		};
	}

	// Filter by Kelas
	if (input.kelasId) {
		whereClause.kelasId = input.kelasId;
	}

	// Filter by Jenis Kelas or Level
	if (input.jenisKelasNama || input.level) {
		whereClause.kelas = {
			...(input.jenisKelasNama
				? {
						jenisKelasRel: {
							nama: input.jenisKelasNama,
						},
					}
				: {}),
			...(input.level ? { level: input.level } : {}),
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

	// Filter by Deskripsi
	if (input.deskripsi !== undefined) {
		whereClause.deskripsi = input.deskripsi;
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

	return whereClause;
}
