import { Prisma, StatusPembayaran, StatusPendaftaran } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { UserRole } from "@/server/auth/type";
import { calculateSisaPertemuan } from "@/server/services/pembayaran.service";
import { paginationSchema } from "@/types/pagination.type";
import {
	createPembayaranSchema,
	updatePembayaranSchema,
} from "@/types/pembayaran.schema";
import dayjs from "@/utils/dateUtils";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";

export const pembayaranRouter = createTRPCRouter({
	getAllPaginated: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				status: z.nativeEnum(StatusPembayaran).optional(),
				muridId: z.string().optional(),
				search: z.string().optional(),
				cabangId: z.string().optional(),
				kelasId: z.string().optional(),
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

			const whereClause: Prisma.PembayaranWhereInput = {};
			const pendaftaranFilter: Prisma.PendaftaranKelasWhereInput = {};

			if (filterCabangId)
				pendaftaranFilter.Kelas = { cabangId: filterCabangId };

			if (input.muridId) pendaftaranFilter.muridId = input.muridId;

			if (input.search) {
				pendaftaranFilter.murid = {
					namaLengkap: {
						contains: input.search,
						mode: "insensitive",
					},
				};
			}

			if (Object.keys(pendaftaranFilter).length > 0)
				whereClause.pendaftaranKelas = pendaftaranFilter;

			if (input.kelasId)
				whereClause.pendaftaranKelas = { Kelas: { id: input.kelasId } };

			if (input.status && input.status !== ("ALL" as StatusPembayaran)) {
				whereClause.statusBayar = input.status;
			}

			// Dynamic Sorting
			let orderBy: Prisma.PembayaranOrderByWithRelationInput[] = [
				{ tanggalJatuhTempo: "desc" },
			];

			if (input.sorting && input.sorting.length > 0) {
				orderBy = input.sorting.map((sort) => {
					// Handle nested relationship sorting manually if needed
					// Example: if sort.id is "pendaftaranKelas.murid.namaLengkap"
					// For now assuming direct fields or simple relations that Prisma supports directly via recursive structure if passed correctly
					// However, frontend usually passes dotted paths for nested columns.
					// We might need to map them. Let's start with supporting basic fields.

					// Simple mapping for demonstration of nested sorting support
					if (sort.id === "namaMurid") {
						return {
							pendaftaranKelas: {
								murid: {
									namaLengkap: sort.desc ? "desc" : "asc",
								},
							},
						};
					}
					if (sort.id === "kelas") {
						return {
							pendaftaranKelas: {
								Kelas: {
									kodeKelas: sort.desc ? "desc" : "asc",
								},
							},
						};
					}

					return {
						[sort.id]: sort.desc ? "desc" : "asc",
					};
				});
			}

			// Transaction untuk performa lebih baik (count + findMany)
			const [total, data] = await db.$transaction([
				db.pembayaran.count({ where: whereClause }),
				db.pembayaran.findMany({
					skip: pageIndex * pageSize,
					take: pageSize,
					where: whereClause,
					orderBy: orderBy,
					include: {
						pendaftaranKelas: {
							include: {
								murid: { select: { namaLengkap: true, noWA: true } },
								Kelas: {
									select: {
										kodeKelas: true,
										hargaKelas: true,
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
							},
						},
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
		}),

	// 2. GET TAGIHAN JATUH TEMPO (Untuk Dashboard)
	getTagihanJatuhTempo: cabangProtectedProcedure
		.input(
			paginationSchema.extend({
				cabangId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { pageIndex, pageSize } = input;

			const filterCabangId = allowedCabangId ?? input?.cabangId;
			const DUA_MINGGU_LAGI = dayjs().add(14, "day").endOf("day");

			const whereClause: Prisma.PembayaranWhereInput = {
				statusBayar: {
					in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
				},
				tanggalJatuhTempo: {
					lte: DUA_MINGGU_LAGI.toDate(),
				},
			};

			if (filterCabangId) {
				whereClause.pendaftaranKelas = {
					Kelas: { cabangId: filterCabangId },
				};
			}

			const [total, data] = await db.$transaction([
				db.pembayaran.count({ where: whereClause }),
				db.pembayaran.findMany({
					skip: pageIndex * pageSize,
					take: pageSize,
					where: whereClause,
					orderBy: { createdAt: "desc" },
					include: {
						pendaftaranKelas: {
							include: {
								murid: { select: { namaLengkap: true, noWA: true } },
								Kelas: {
									select: {
										kodeKelas: true,
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

	getForExport: cabangProtectedProcedure
		.input(
			z.object({
				status: z.nativeEnum(StatusPembayaran).optional(),
				muridId: z.string().optional(),
				search: z.string().optional(),
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

			const filterCabangId = allowedCabangId ?? input.cabangId;

			const whereClause: Prisma.PembayaranWhereInput = {};
			const pendaftaranFilter: Prisma.PendaftaranKelasWhereInput = {};

			if (filterCabangId)
				pendaftaranFilter.Kelas = { cabangId: filterCabangId };

			if (input.muridId) pendaftaranFilter.muridId = input.muridId;

			if (input.search) {
				pendaftaranFilter.murid = {
					namaLengkap: {
						contains: input.search,
						mode: "insensitive",
					},
				};
			}

			if (Object.keys(pendaftaranFilter).length > 0) {
				whereClause.pendaftaranKelas = pendaftaranFilter;
			}

			if (input.status && input.status !== ("ALL" as StatusPembayaran)) {
				whereClause.statusBayar = input.status;
			}

			// Dynamic Sorting
			let orderBy: Prisma.PembayaranOrderByWithRelationInput[] = [
				{ tanggalJatuhTempo: "desc" },
			];

			if (input.sorting && input.sorting.length > 0) {
				orderBy = input.sorting.map((sort) => {
					// Handle nested relationship sorting manually if needed
					if (sort.id === "namaMurid") {
						return {
							pendaftaranKelas: {
								murid: {
									namaLengkap: sort.desc ? "desc" : "asc",
								},
							},
						};
					}
					if (sort.id === "kelas") {
						return {
							pendaftaranKelas: {
								Kelas: {
									kodeKelas: sort.desc ? "desc" : "asc",
								},
							},
						};
					}

					return {
						[sort.id]: sort.desc ? "desc" : "asc",
					};
				});
			}

			const data = await db.pembayaran.findMany({
				where: whereClause,
				orderBy: orderBy,
				select: {
					pembayaranKe: true,
					jumlahBayar: true,
					tanggalJatuhTempo: true,
					tanggalBayar: true,
					note: true,
					statusBayar: true,
					verifiedBy: { select: { name: true } },
					pendaftaranKelas: {
						select: {
							murid: { select: { namaLengkap: true } },
							Kelas: {
								select: {
									kodeKelas: true,
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
						},
					},
				},
			});

			return data;
		}),

	getSaldoByMuridId: cabangProtectedProcedure
		.input(z.object({ muridId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// Ambil SEMUA pendaftaran aktif/trial murid ini
			const pendaftaranList = await db.pendaftaranKelas.findMany({
				where: {
					muridId: input.muridId,
					status: { in: [StatusPendaftaran.AKTIF, StatusPendaftaran.TRIAL] },
				},
				include: {
					Kelas: { select: { cabangId: true } },
				},
			});

			if (pendaftaranList.length === 0) {
				return null;
			}

			// Security check cabang (cukup cek dari kelas pertama)
			if (
				allowedCabangId &&
				pendaftaranList[0]?.Kelas.cabangId !== allowedCabangId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Anda tidak berhak melihat data saldo siswa dari cabang lain.",
				});
			}

			// Hitung saldo per-kelas secara paralel (aman: calculateSisaPertemuan sudah per-kelas)
			const saldoList = await Promise.all(
				pendaftaranList.map((p) => calculateSisaPertemuan(db, p.id)),
			);

			return {
				saldoList,
				isMultiKelas: saldoList.length > 1,
			};
		}),

	updatePembayaran: cabangProtectedProcedure
		.input(updatePembayaranSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;

			// 1. Authorization Check
			if (
				session.user.role !== UserRole.ADMIN &&
				session.user.role !== UserRole.MANAGER
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Hanya Admin atau Manager yang dapat mengupdate data pembayaran.",
				});
			}

			// 2. Ambil data lama & Cek Kepemilikan (Layer 2)
			const existingPayment = await db.pembayaran.findUnique({
				where: { id: input.id },
				include: {
					pendaftaranKelas: {
						include: { Kelas: { select: { cabangId: true } } },
					},
				},
			});

			if (!existingPayment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data pembayaran tidak ditemukan.",
				});
			}

			// Validasi Cabang
			const paymentCabangId = existingPayment.pendaftaranKelas.Kelas.cabangId;

			if (allowedCabangId && paymentCabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengedit pembayaran dari cabang lain.",
				});
			}

			try {
				// 3. Prepare update data
				const updateData: Prisma.PembayaranUpdateInput = {
					jumlahBayar: input.jumlahBayar,
					note: input.note,
					statusBayar: input.statusBayar,
					tanggalJatuhTempo: input.tanggalJatuhTempo,
				};

				// Logic: Handling Status Changes
				if (input.statusBayar === StatusPembayaran.LUNAS) {
					updateData.verifiedBy = { connect: { id: session.user.id } };
					updateData.tanggalBayar = input.tanggalBayar ?? new Date();
				} else {
					updateData.verifiedBy = { disconnect: true };
					updateData.tanggalBayar = null;
				}

				const updated = await db.pembayaran.update({
					where: { id: input.id },
					data: updateData,
				});

				return updated;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Pembayaran tidak ditemukan atau sudah dihapus.",
						});
					}
				}
				throw error;
			}
		}),

	// 5. [BARU] CREATE TAGIHAN MANUAL
	// Jika admin perlu membuat tagihan di luar siklus otomatis
	createManualTagihan: cabangProtectedProcedure
		.input(createPembayaranSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;

			// 1. Validasi Kepemilikan Pendaftaran (Siswa)
			const pendaftaran = await db.pendaftaranKelas.findUnique({
				where: { id: input.pendaftaranKelasId },
				include: { Kelas: { select: { cabangId: true } } }, // Ambil cabangId dari Kelas
			});

			if (!pendaftaran) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data pendaftaran siswa tidak ditemukan.",
				});
			}

			// 2. Security Check: Apakah user berhak membuat tagihan untuk siswa ini?

			if (allowedCabangId && pendaftaran.Kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Anda tidak berhak membuat tagihan untuk siswa dari cabang lain.",
				});
			}

			const tanggalTransaksi = input.tanggalBayar ?? new Date();

			try {
				let urutan = input.pembayaranKe;
				if (!urutan) {
					const lastBill = await db.pembayaran.findFirst({
						where: { pendaftaranKelasId: input.pendaftaranKelasId },
						orderBy: { pembayaranKe: "desc" },
					});
					urutan = (lastBill?.pembayaranKe ?? 0) + 1;
				}

				return db.pembayaran.create({
					data: {
						pendaftaranKelasId: input.pendaftaranKelasId,
						jumlahBayar: input.jumlahBayar,
						tanggalJatuhTempo: tanggalTransaksi,
						tanggalBayar: tanggalTransaksi,
						pembayaranKe: urutan,
						statusBayar: StatusPembayaran.LUNAS,
						verifiedById: session.user.id,
						note: input.note ?? "Tagihan Manual Admin",
					},
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					// P2002: Konflik pada [pendaftaranKelasId, pembayaranKe]
					if (error.code === "P2002") {
						throw new TRPCError({
							code: "CONFLICT",
							message: `Tagihan ke-${input.pembayaranKe ?? "?"} sudah ada untuk siswa ini. Harap cek kembali urutan pembayaran.`,
						});
					}
					// P2003: Pendaftaran ID salah
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Data Pendaftaran Siswa tidak valid.",
						});
					}
				}
				throw error;
			}
		}),

	// 6. DELETE TAGIHAN
	// Hati-hati, menghapus tagihan LUNAS akan mengurangi saldo pertemuan siswa!
	deletePembayaran: cabangProtectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;

			// 1. Role Check
			if (
				session.user.role !== UserRole.ADMIN &&
				session.user.role !== UserRole.MANAGER
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak memiliki akses untuk menghapus pembayaran.",
				});
			}

			// 2. Ambil data & Cek Kepemilikan
			const existingPayment = await db.pembayaran.findUnique({
				where: { id: input.id },
				include: {
					pendaftaranKelas: {
						include: { Kelas: { select: { cabangId: true } } },
					},
				},
			});

			if (!existingPayment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Pembayaran tidak ditemukan.",
				});
			}

			// Validasi Cabang
			const paymentCabangId = existingPayment.pendaftaranKelas.Kelas.cabangId;

			if (allowedCabangId && paymentCabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus pembayaran dari cabang lain.",
				});
			}

			if (session.user.role !== UserRole.ADMIN) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Hanya Admin yang boleh menghapus data pembayaran.",
				});
			}

			try {
				return await db.pembayaran.delete({
					where: { id: input.id },
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Pembayaran sudah dihapus atau tidak ditemukan.",
						});
					}
				}
				throw error;
			}
		}),
});
