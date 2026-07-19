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
			const { pageIndex, pageSize } = input;

			const filterCabangId = allowedCabangId ?? input.cabangId;

			const whereClause: Prisma.PembayaranWhereInput = {};
			const pendaftaranFilter: Prisma.PendaftaranKelasWhereInput = {};
			const kelasFilter: Prisma.KelasWhereInput = {};

			if (filterCabangId) kelasFilter.cabangId = filterCabangId;

			if (input.kelasId) kelasFilter.id = input.kelasId;

			if (input.level) kelasFilter.level = input.level;

			if (input.jenisKelasNama) {
				kelasFilter.jenisKelasRel = {
					nama: input.jenisKelasNama,
				};
			}

			if (Object.keys(kelasFilter).length > 0) {
				pendaftaranFilter.Kelas = kelasFilter;
			}

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
										level: true,
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
										level: true,
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

			const whereClause: Prisma.PembayaranWhereInput = {};
			const pendaftaranFilter: Prisma.PendaftaranKelasWhereInput = {};
			const kelasFilter: Prisma.KelasWhereInput = {};

			if (filterCabangId) kelasFilter.cabangId = filterCabangId;

			if (input.level) kelasFilter.level = input.level;

			if (input.jenisKelasNama) {
				kelasFilter.jenisKelasRel = {
					nama: input.jenisKelasNama,
				};
			}

			if (Object.keys(kelasFilter).length > 0) {
				pendaftaranFilter.Kelas = kelasFilter;
			}

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

	// Tandai status "sudah diingatkan" / "belum diingatkan" via WA (per tagihan SPP)
	toggleDiingatkan: cabangProtectedProcedure
		.input(z.object({ id: z.string(), value: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

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

			const paymentCabangId = existingPayment.pendaftaranKelas.Kelas.cabangId;
			if (allowedCabangId && paymentCabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengedit pembayaran dari cabang lain.",
				});
			}

			return db.pembayaran.update({
				where: { id: input.id },
				data: { sudahDiingatkan: input.value },
			});
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

	// 6b. DELETE TAGIHAN SEKALIGUS BANYAK (BULK)
	// Hati-hati, menghapus tagihan LUNAS akan mengurangi saldo pertemuan siswa!
	deleteManyPembayaran: cabangProtectedProcedure
		.input(z.object({ ids: z.array(z.string()).min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;

			// 1. Role Check - hanya Admin yang boleh menghapus data pembayaran
			if (session.user.role !== UserRole.ADMIN) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Hanya Admin yang boleh menghapus data pembayaran.",
				});
			}

			// 2. Ambil semua data & cek kepemilikan cabang
			const existingPayments = await db.pembayaran.findMany({
				where: { id: { in: input.ids } },
				include: {
					pendaftaranKelas: {
						include: { Kelas: { select: { cabangId: true } } },
					},
				},
			});

			if (existingPayments.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Pembayaran tidak ditemukan.",
				});
			}

			const hasForeignCabang = existingPayments.some(
				(p) =>
					allowedCabangId &&
					p.pendaftaranKelas.Kelas.cabangId !== allowedCabangId,
			);
			if (hasForeignCabang) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus pembayaran dari cabang lain.",
				});
			}

			const validIds = existingPayments.map((p) => p.id);

			const result = await db.pembayaran.deleteMany({
				where: { id: { in: validIds } },
			});

			return { count: result.count };
		}),

	// GET RINGKASAN TAGIHAN PER KELAS (SPP + Buku + Registrasi digabung per murid)
	// Dipakai di halaman "Pembayaran Kelas" (/admin/pembayaran?kelasId=...)
	getRingkasanKelas: cabangProtectedProcedure
		.input(z.object({ kelasId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const kelas = await db.kelas.findUnique({
				where: { id: input.kelasId },
				select: {
					id: true,
					kodeKelas: true,
					cabangId: true,
					cabang: {
						select: { noRekening: true, bank: true, atasNama: true },
					},
				},
			});

			if (!kelas) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Kelas tidak ditemukan.",
				});
			}

			if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak melihat data kelas dari cabang lain.",
				});
			}

			const [pembayarans, tagihanLains] = await Promise.all([
				db.pembayaran.findMany({
					where: { pendaftaranKelas: { kelasId: input.kelasId } },
					orderBy: { pembayaranKe: "asc" },
					include: {
						pendaftaranKelas: {
							include: {
								murid: { select: { id: true, namaLengkap: true, noWA: true } },
							},
						},
					},
				}),
				db.tagihanLain.findMany({
					where: { kelasId: input.kelasId },
					orderBy: { createdAt: "asc" },
					include: {
						murid: { select: { id: true, namaLengkap: true, noWA: true } },
					},
				}),
			]);

			type RingkasanMurid = {
				muridId: string;
				namaLengkap: string;
				noWA: string;
				spp: {
					id: string;
					label: string;
					jumlahBayar: number;
					statusBayar: StatusPembayaran;
					tanggalJatuhTempo: Date;
					pembayaranKe: number;
					sudahDiingatkan: boolean;
				}[];
				buku: {
					id: string;
					label: string;
					jumlah: number;
					status: StatusPembayaran;
					sudahDiingatkan: boolean;
				}[];
				registrasi: {
					id: string;
					label: string;
					jumlah: number;
					status: StatusPembayaran;
					sudahDiingatkan: boolean;
				}[];
			};

			const muridMap = new Map<string, RingkasanMurid>();

			const getOrCreate = (
				muridId: string,
				namaLengkap: string,
				noWA: string,
			) => {
				const existing = muridMap.get(muridId);
				if (existing) return existing;
				const created: RingkasanMurid = {
					muridId,
					namaLengkap,
					noWA,
					spp: [],
					buku: [],
					registrasi: [],
				};
				muridMap.set(muridId, created);
				return created;
			};

			for (const p of pembayarans) {
				const murid = p.pendaftaranKelas.murid;
				const entry = getOrCreate(murid.id, murid.namaLengkap, murid.noWA);
				entry.spp.push({
					id: p.id,
					label: `SPP Ke-${p.pembayaranKe}`,
					jumlahBayar: p.jumlahBayar,
					statusBayar: p.statusBayar,
					tanggalJatuhTempo: p.tanggalJatuhTempo,
					pembayaranKe: p.pembayaranKe,
					sudahDiingatkan: p.sudahDiingatkan,
				});
			}

			for (const t of tagihanLains) {
				const entry = getOrCreate(
					t.murid.id,
					t.murid.namaLengkap,
					t.murid.noWA,
				);
				const item = {
					id: t.id,
					label: t.judul,
					jumlah: t.jumlah,
					status: t.status,
					sudahDiingatkan: t.sudahDiingatkan,
				};
				if (t.kategori === "BUKU") {
					entry.buku.push(item);
				} else if (t.kategori === "REGISTRASI") {
					entry.registrasi.push(item);
				}
			}

			const data = Array.from(muridMap.values())
				.map((entry) => {
					const totalBelumLunas =
						entry.spp
							.filter((s) => s.statusBayar !== StatusPembayaran.LUNAS)
							.reduce((sum, s) => sum + s.jumlahBayar, 0) +
						entry.buku
							.filter((b) => b.status !== StatusPembayaran.LUNAS)
							.reduce((sum, b) => sum + b.jumlah, 0) +
						entry.registrasi
							.filter((r) => r.status !== StatusPembayaran.LUNAS)
							.reduce((sum, r) => sum + r.jumlah, 0);

					// Tenggat hanya tersedia untuk SPP (Buku/Registrasi tidak punya
					// kolom tanggal jatuh tempo di database).
					const sppBelumLunas = entry.spp
						.filter((s) => s.statusBayar !== StatusPembayaran.LUNAS)
						.map((s) => s.tanggalJatuhTempo);
					const tenggatTerdekat =
						sppBelumLunas.length > 0
							? sppBelumLunas.sort((a, b) => a.getTime() - b.getTime())[0]
							: null;

					return { ...entry, totalBelumLunas, tenggatTerdekat };
				})
				.sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

			return {
				kelas: {
					id: kelas.id,
					kodeKelas: kelas.kodeKelas,
					noRekening: kelas.cabang.noRekening,
					bank: kelas.cabang.bank,
					atasNama: kelas.cabang.atasNama,
				},
				data,
			};
		}),

	// RINGKASAN SEMUA KELAS (untuk grid pemilihan kelas di tab "Ringkasan & Ingatkan")
	getRingkasanSemuaKelas: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional().nullable() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId ?? undefined;

			const kelasList = await db.kelas.findMany({
				where: {
					statusKelas: { not: "COMPLETED" },
					...(filterCabangId ? { cabangId: filterCabangId } : {}),
				},
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					kodeKelas: true,
					level: true,
					statusKelas: true,
					jenisKelasRel: { select: { nama: true, tipe: true } },
					pendaftaranKelases: {
						where: { status: "AKTIF" },
						select: { id: true },
					},
				},
			});

			const kelasIds = kelasList.map((k) => k.id);

			const [pembayarans, tagihanLains] = await Promise.all([
				db.pembayaran.findMany({
					where: {
						pendaftaranKelas: { kelasId: { in: kelasIds } },
						statusBayar: { not: StatusPembayaran.LUNAS },
					},
					select: {
						jumlahBayar: true,
						pendaftaranKelas: { select: { kelasId: true } },
					},
				}),
				db.tagihanLain.findMany({
					where: {
						kelasId: { in: kelasIds },
						status: { not: StatusPembayaran.LUNAS },
					},
					select: { jumlah: true, kelasId: true },
				}),
			]);

			const totalMap = new Map<string, number>();
			for (const p of pembayarans) {
				const kId = p.pendaftaranKelas.kelasId;
				totalMap.set(kId, (totalMap.get(kId) ?? 0) + p.jumlahBayar);
			}
			for (const t of tagihanLains) {
				if (!t.kelasId) continue;
				totalMap.set(t.kelasId, (totalMap.get(t.kelasId) ?? 0) + t.jumlah);
			}

			return kelasList.map((k) => ({
				id: k.id,
				kodeKelas: k.kodeKelas,
				jenisKelasNama: k.jenisKelasRel?.nama ?? "-",
				tipe: k.jenisKelasRel?.tipe ?? "REGULAR",
				level: k.level,
				statusKelas: k.statusKelas ?? "RUNNING",
				jumlahSiswa: k.pendaftaranKelases.length,
				totalBelumLunas: totalMap.get(k.id) ?? 0,
			}));
		}),
});
