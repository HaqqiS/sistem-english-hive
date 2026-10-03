import {
	PeranGuru,
	Prisma,
	StatusAbsenGuru,
	StatusAbsenMurid,
	StatusPendaftaran,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import z from "zod";
import { UserRole } from "@/server/auth/type";
import { getPeriodeGaji } from "@/server/services/gaji.service";
import {
	createSesiPertemuanCore,
	handleAutoLevelUp,
} from "@/server/services/kelas.service";
import { processAutoBilling } from "@/server/services/pembayaran.service";
import {
	buatKodePenggantian,
	verifikasiKodePenggantian,
} from "@/server/services/penggantian-token.service";
import {
	buatTokenPenggantiSchema,
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

				sesiFilter.tanggalWaktu = {
					gte: startDate,
					lte: endDate,
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
						peran: true,
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
					peran: true,
					sesiPertemuanKelas: {
						select: {
							tanggalWaktu: true,
							kelas: {
								select: {
									kodeKelas: true,
									// jenisKelas: true, // Legacy
									// jenisKelas: true, // Legacy
									jenisKelasRel: { select: { nama: true, tipe: true } },
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
					peran: true,
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
			const { jadwalKelasId, status, overrideRuangId, tokenPengganti } = input;

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
								jenisKelasRel: { select: { nama: true } },
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

				// Guru harus punya penugasan aktif di kelas ini (guru utama ATAU
				// asisting) sebelum bisa memulai/bergabung ke sebuah sesi.
				// Jalur kedua: guru pengganti yang membawa kode dari guru asli.
				const guruAssignment = await db.historyGuruKelas.findFirst({
					where: { kelasId: jadwal.kelasId, guruId, statusGuru: "ACTIVE" },
					select: { peran: true },
				});

				let peranGuruIni = guruAssignment?.peran;

				if (!guruAssignment) {
					if (!tokenPengganti) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message:
								"Anda tidak (lagi) ditugaskan pada kelas ini. Jika Anda menggantikan guru lain, minta kode pengganti dari guru tersebut.",
						});
					}

					// Kandidat guru asli = guru yang sedang bertugas (ACTIVE) di kelas ini.
					// Kode 8 digit dicocokkan ke salah satu dari mereka.
					const kandidatGuruAsli = await db.historyGuruKelas.findMany({
						where: { kelasId: jadwal.kelasId, statusGuru: "ACTIVE" },
						select: { guruId: true, peran: true },
					});

					const { guruAsliId } = verifikasiKodePenggantian(tokenPengganti, {
						jadwalKelasId,
						guruPenggantiId: guruId,
						kandidatGuruAsliIds: kandidatGuruAsli.map((k) => k.guruId),
					});

					// Pengganti mengikuti peran guru yang digantikan
					peranGuruIni = kandidatGuruAsli.find(
						(k) => k.guruId === guruAsliId,
					)?.peran;
				}

				if (!peranGuruIni) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Anda tidak (lagi) ditugaskan pada kelas ini.",
					});
				}
				// 2. Tentukan ruangId yang akan dipakai
				// Prioritaskan override, jika tidak ada, pakai ruang dari jadwal
				const finalRuangId = overrideRuangId ?? jadwal.ruangId;
				// 3. Tentukan tanggalWaktu (REALITA)
				// Gunakan Waktu WITA saat ini
				const tanggalWaktuSesi = dayjs().tz(TIMEZONE_BISNIS).toDate();

				// 5. Transaction: Buat Sesi -> Buat Absensi -> Cek Level Up -> Cek Finish
				const result = await db.$transaction(
					async (tx) => {
						// 4a. Buat SesiPertemuanKelas (Realisasi) via Core Service
						const { sesi: newSesi, isExisting } = await createSesiPertemuanCore(
							tx,
							{
								kelasId: jadwal.kelasId,
								ruangId: finalRuangId,
								tanggalWaktu: tanggalWaktuSesi,
								jadwalKelasId: jadwalKelasId,
								isTeacher: true,
							},
						);

						if (isExisting) {
							// Sesi sudah dibuat (oleh guru lain, atau oleh guru ini di tab
							// lain). Guru ini tetap perlu tercatat kehadirannya sendiri —
							// penting untuk guru asisting yang menekan "Mulai Sesi" belakangan.
							// @@unique([guruId, sesiPertemuanKelasId]) menjaga ini idempotent.
							await tx.absensiGuru.upsert({
								where: {
									guruId_sesiPertemuanKelasId: {
										guruId,
										sesiPertemuanKelasId: newSesi.id,
									},
								},
								update: {},
								create: {
									guruId,
									sesiPertemuanKelasId: newSesi.id,
									status,
									peran: peranGuruIni,
									isVerified: false,
								},
							});

							return {
								newSesiId: newSesi.id,
								absensiId: null,
								isFinished: false,
							};
						}

						// 4b. Buat AbsensiGuru
						await tx.absensiGuru.create({
							data: {
								guruId,
								sesiPertemuanKelasId: newSesi.id,
								status,
								peran: peranGuruIni,
								isVerified: false,
							},
						});

						// 4c. Buat AbsensiMurid untuk murid yang AKTIF/TRIAL/OFF_SEMENTARA di kelas ini
						// Pisah menjadi 2 grup:
						// - AKTIF & TRIAL → status ALPA (default) + trigger billing
						// - OFF_SEMENTARA  → status OFF_SEMENTARA (no billing, read-only)
						const semuaMuridKelas = await tx.pendaftaranKelas.findMany({
							where: {
								kelasId: jadwal.kelasId,
								status: {
									in: [
										StatusPendaftaran.AKTIF,
										StatusPendaftaran.TRIAL,
										StatusPendaftaran.OFF_SEMENTARA,
									],
								},
							},
							select: { id: true, muridId: true, status: true },
						});

						const muridAktif = semuaMuridKelas.filter(
							(m) =>
								m.status === StatusPendaftaran.AKTIF ||
								m.status === StatusPendaftaran.TRIAL,
						);
						const muridOffSementara = semuaMuridKelas.filter(
							(m) => m.status === StatusPendaftaran.OFF_SEMENTARA,
						);

						if (muridAktif.length > 0) {
							await tx.absensiMurid.createMany({
								data: muridAktif.map((m) => ({
									muridId: m.muridId,
									sesiPertemuanKelasId: newSesi.id,
									status: StatusAbsenMurid.ALPA,
								})),
							});

							// Kalkulasi Tagihan hanya untuk murid AKTIF/TRIAL
							await Promise.all(
								muridAktif.map((m) =>
									processAutoBilling(tx, m.id, jadwal.kelasId),
								),
							);
						}

						// Buat absensi OFF_SEMENTARA (read-only, tidak trigger billing)
						if (muridOffSementara.length > 0) {
							await tx.absensiMurid.createMany({
								data: muridOffSementara.map((m) => ({
									muridId: m.muridId,
									sesiPertemuanKelasId: newSesi.id,
									status: StatusAbsenMurid.OFF_SEMENTARA,
								})),
							});
						}

						return {
							newSesiId: newSesi.id,
							absensiId: null,
						};
					},
					{ timeout: 20000 },
				); // Tambah timeout ke 20 detik karena create banyak tagihan dan data

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

	/**
	 * Daftar guru lain di cabang yang sama.
	 * Dipakai guru asli untuk memilih guru pengganti saat menerbitkan kode.
	 */
	getDaftarGuruPengganti: cabangProtectedProcedure.query(async ({ ctx }) => {
		const { db, session, allowedCabangId } = ctx;

		if (session.user.role !== UserRole.GURU) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Hanya guru yang dapat melihat daftar guru pengganti.",
			});
		}

		return db.user.findMany({
			where: {
				role: "GURU",
				cabangId: allowedCabangId,
				id: { not: session.user.id },
			},
			select: { id: true, name: true },
			orderBy: { name: "asc" },
		});
	}),

	/**
	 * Guru asli menerbitkan kode pengganti (8 digit angka) untuk satu jadwal
	 * kelas pada satu tanggal. Kode dikirim ke guru pengganti (mis. lewat
	 * WhatsApp). Stateless: tidak ada data yang disimpan di database.
	 */
	buatTokenPengganti: cabangProtectedProcedure
		.input(buatTokenPenggantiSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;
			const guruAsliId = session.user.id;

			if (session.user.role !== UserRole.GURU) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Hanya guru yang bertugas di kelas yang dapat menerbitkan kode.",
				});
			}

			if (input.guruPenggantiId === guruAsliId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Guru pengganti tidak boleh diri sendiri.",
				});
			}

			const jadwal = await db.jadwalKelas.findUnique({
				where: { id: input.jadwalKelasId },
				select: {
					id: true,
					kelasId: true,
					kelas: { select: { kodeKelas: true, cabangId: true } },
				},
			});

			if (!jadwal) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Jadwal tidak ditemukan.",
				});
			}

			if (allowedCabangId && jadwal.kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Anda tidak berhak menerbitkan kode untuk kelas di cabang lain.",
				});
			}

			// Hanya guru yang benar-benar bertugas di kelas ini yang boleh memberi kode
			const penugasan = await db.historyGuruKelas.findFirst({
				where: {
					kelasId: jadwal.kelasId,
					guruId: guruAsliId,
					statusGuru: "ACTIVE",
				},
				select: { id: true },
			});

			if (!penugasan) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak (lagi) ditugaskan pada kelas ini.",
				});
			}

			const pengganti = await db.user.findUnique({
				where: { id: input.guruPenggantiId },
				select: { id: true, name: true, role: true, cabangId: true },
			});

			if (pengganti?.role !== "GURU") {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Guru pengganti tidak ditemukan.",
				});
			}

			if (pengganti.cabangId !== jadwal.kelas.cabangId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Guru pengganti harus berada di cabang yang sama dengan kelas.",
				});
			}

			const tanggal =
				input.tanggal ?? dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM-DD");

			const { kode, kodeFormat, kedaluwarsa } = buatKodePenggantian({
				jadwalKelasId: jadwal.id,
				guruAsliId,
				guruPenggantiId: pengganti.id,
				tanggal,
			});

			return {
				kode,
				kodeFormat,
				tanggal,
				kedaluwarsa,
				kodeKelas: jadwal.kelas.kodeKelas,
				namaGuruPengganti: pengganti.name,
			};
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
			const { status, isVerified, guruId, absensiId, peran } = input;

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
						peran: peran,
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

	createManualAbsensi: cabangProtectedProcedure
		.input(
			z.object({
				guruId: z.string().cuid(),
				kelasId: z.string().cuid().optional(), // Wajib jika sesiPertemuanKelasId kosong
				sesiPertemuanKelasId: z.string().cuid().optional(),
				tanggalWaktu: z.date().optional(), // Wajib jika sesiPertemuanKelasId kosong
				status: z.nativeEnum(StatusAbsenGuru),
				isVerified: z.boolean(),
				/** Opsional: Guru/Guru Asisting. Default: ikut penugasan aktif guru di kelas ini, fallback UTAMA. */
				peran: z.nativeEnum(PeranGuru).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;
			const {
				guruId,
				sesiPertemuanKelasId,
				kelasId,
				tanggalWaktu,
				status,
				isVerified,
				peran,
			} = input;

			// 1. Permission Check
			if (
				session.user.role !== UserRole.ADMIN &&
				session.user.role !== UserRole.MANAGER
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Hanya Admin/Manager yang dapat membuat absensi manual.",
				});
			}

			// CASE A: Add Attendance to EXISTING Session
			if (sesiPertemuanKelasId) {
				// 2a. Fetch Session & Security Check
				const sesi = await db.sesiPertemuanKelas.findUnique({
					where: { id: sesiPertemuanKelasId },
					include: {
						kelas: {
							select: { cabangId: true },
						},
					},
				});

				if (!sesi) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Sesi pertemuan tidak ditemukan.",
					});
				}

				if (allowedCabangId && sesi.kelas.cabangId !== allowedCabangId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Anda tidak berhak membuat absensi untuk cabang ini.",
					});
				}

				// Tentukan peran: pakai input jika ada, kalau tidak ikut penugasan
				// aktif guru ini di kelas tsb, fallback UTAMA (mis. pengganti dadakan
				// tanpa penugasan formal).
				const resolvedPeran =
					peran ??
					(
						await db.historyGuruKelas.findFirst({
							where: {
								kelasId: sesi.kelasId,
								guruId,
								statusGuru: "ACTIVE",
							},
							select: { peran: true },
						})
					)?.peran ??
					"UTAMA";

				// 3a. Create AbsensiGuru
				try {
					return await db.absensiGuru.create({
						data: {
							guruId,
							sesiPertemuanKelasId,
							status,
							peran: resolvedPeran,
							isVerified: isVerified,
							verifiedById: isVerified ? session.user.id : null,
							createdAt: sesi.tanggalWaktu, // Follow session date
						},
					});
				} catch (error) {
					if (error instanceof Prisma.PrismaClientKnownRequestError) {
						if (error.code === "P2002") {
							throw new TRPCError({
								code: "CONFLICT",
								message: "Guru ini sudah absen di sesi tersebut.",
							});
						}
					}
					throw error;
				}
			}

			// CASE B: Create NEW Session & Attendance (Manual / Substitute / Forgotten)
			if (!kelasId || !tanggalWaktu) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Kelas dan Tanggal Waktu wajib diisi jika membuat sesi baru.",
				});
			}

			// 2b. Find Default Room from Schedule & Validate Branch
			const jadwal = await db.jadwalKelas.findFirst({
				where: { kelasId: kelasId },
				select: {
					id: true,
					ruangId: true,
					kelas: { select: { cabangId: true } },
					// We might want to match the Day of Week if we want to be smarter,
					// but user requirement says just pick one.
				},
			});

			// Fallback: If no schedule, maybe check if class exists to validate branch?
			// But requirement says "Find JadwalKelas... Throw error if no schedule/room found."
			if (!jadwal) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						"Jadwal Kelas tidak ditemukan. Tidak dapat menentukan ruangan default.",
				});
			}

			if (allowedCabangId && jadwal.kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak membuat sesi untuk kelas di cabang lain.",
				});
			}

			// 3b. Transaction: Create Session -> Create Attendance -> Handle Hooks
			const resolvedPeranBaru =
				peran ??
				(
					await db.historyGuruKelas.findFirst({
						where: { kelasId, guruId, statusGuru: "ACTIVE" },
						select: { peran: true },
					})
				)?.peran ??
				"UTAMA";

			const result = await db.$transaction(async (tx) => {
				// Create Session
				const newSesi = await tx.sesiPertemuanKelas.create({
					data: {
						kelasId: kelasId,
						ruangId: jadwal.ruangId,
						tanggalWaktu: tanggalWaktu,
						jadwalKelasId: jadwal.id, // Optional linkage
					},
				});

				// Create Attendance
				const newAbsensi = await tx.absensiGuru.create({
					data: {
						guruId: guruId,
						sesiPertemuanKelasId: newSesi.id,
						status: status,
						peran: resolvedPeranBaru,
						isVerified: isVerified,
						verifiedById: isVerified ? session.user.id : null,
						createdAt: tanggalWaktu,
					},
				});

				// === SERVICE LOGIC HANDLERS ===
				// Hitung Total Sesi (Termasuk yang baru dibuat)
				const totalSesi = await tx.sesiPertemuanKelas.count({
					where: { kelasId: kelasId },
				});

				// Level Up (Sesi 20)
				// Note: handleAutoLevelUp usually needs a full `jadwal` object with included relations.
				// We need to fetch full jadwal or adjust the service.
				// Let's create a 'mock' jadwal or fetch it properly if we want to support Level Up here.
				// For safety/speed, let's re-fetch the full jadwal struct expected by service if needed.
				// or just skip if it's too complex for "manual" entry?
				// Plan said "Trigger handleAutoLevelUp... logic".
				// Let's try to do it best effort.

				if (totalSesi === 20) {
					// We need full jadwal for auto level up
					const fullJadwal = await tx.jadwalKelas.findUnique({
						where: { id: jadwal.id },
						include: {
							kelas: {
								include: {
									jenisKelasRel: true,
								},
							},
						},
					});

					if (fullJadwal) {
						await handleAutoLevelUp({ tx, jadwal: fullJadwal });
					}
				}

				return newAbsensi;
			});

			return result;
		}),
});
