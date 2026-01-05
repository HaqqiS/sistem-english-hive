import { Hari, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { cabangProtectedProcedure, createTRPCRouter } from "@/server/api/trpc";
import {
	createBulkJadwal,
	updateJadwal,
} from "@/server/services/jadwal.service";
import {
	serverCreateBulkJadwalSchema,
	serverUpdateJadwalSchema,
} from "@/types/jadwalKelas.type";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

export const jadwalKelasRouter = createTRPCRouter({
	getScheduleMatrix: cabangProtectedProcedure
		.input(
			z.object({
				cabangId: z.string().optional(),
				hari: z.nativeEnum(Hari),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const finalCabangId = allowedCabangId ?? input.cabangId;

			if (!finalCabangId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Harap pilih spesifik cabang untuk melihat Kalender Jadwal.",
				});
			}
			const whereClause: Prisma.JadwalKelasWhereInput = {};
			if (finalCabangId) whereClause.kelas = { cabangId: finalCabangId };

			// Optimasi: Jalankan 2 query secara paralel daripada nested deep include
			const [rooms, rawSchedules] = await Promise.all([
				// 1. Ambil Ruangan (Ringan)
				db.ruang.findMany({
					where: { cabangId: finalCabangId, isAktif: true },
					orderBy: { namaRuang: "asc" },
					select: { id: true, namaRuang: true },
				}),

				// 2. Ambil Jadwal (Terfilter specific hari & cabang)
				db.jadwalKelas.findMany({
					where: {
						hari: input.hari,
						ruang: {
							cabangId: finalCabangId,
						},
						...whereClause,
					},

					include: {
						jamSlotTetap: true, // Mengambil full object (id, namaSlot, dll)
						jamSlotCustom: true, // Mengambil full object
						ruang: {
							select: {
								namaRuang: true,
								cabang: { select: { namaCabang: true } },
							},
						},
						kelas: {
							select: {
								kodeKelas: true,
								jenisKelasRel: { select: { nama: true, tipe: true } },
								deskripsi: true,
								level: true,
								grup: true,
								hargaKelas: true,
								bulanTahunAjar: true,
								cohortId: true,
								cabangId: true,
								statusKelas: true,

								// Count & History untuk tampilan Matrix
								_count: {
									select: {
										pendaftaranKelases: {
											where: { NOT: { status: "NON_AKTIF" } },
										},
									},
								},
								historyGuruKelases: {
									where: { statusGuru: "ACTIVE" },
									take: 1,
									select: {
										guru: { select: { name: true } },
									},
								},
								pendaftaranKelases: {
									select: {
										murid: {
											select: {
												namaLengkap: true,
											},
										},
									},
								},
							},
						},
					},
				}),
			]);

			// 3. Formatting Data di level Aplikasi (Lebih cepat daripada DB formatting)
			const formattedSchedules = rawSchedules.map((s) => {
				const jam = s.jamSlotTetap ?? s.jamSlotCustom;

				return {
					id: s.id,
					ruangId: s.ruangId,
					kelasId: s.kelasId,
					kodeKelas: s.kelas.kodeKelas,
					tipeKelas: s.kelas.jenisKelasRel?.tipe ?? "-",
					guru: s.kelas.historyGuruKelases[0]?.guru.name ?? "Belum ada guru",
					jamMulai: jam?.jamMulai ?? "00:00",
					jamSelesai: jam?.jamSelesai ?? "00:00",
					jumlahMurid: s.kelas._count.pendaftaranKelases,
					statusKelas: s.kelas.statusKelas,

					originalData: s,
				};
			});

			return {
				rooms,
				schedules: formattedSchedules,
			};
		}),

	/**
	 * Membuat JadwalKelas baru.
	 * Ini menangani kelas REGULAR (link ke JamSlotTetap)
	 * dan kelas PRIVATE (membuat JamSlotCustom baru)
	 */
	create: cabangProtectedProcedure
		.input(serverCreateBulkJadwalSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			try {
				// Gunakan Function Service yang baru
				const result = await db.$transaction(async (tx) => {
					return createBulkJadwal({
						tx,
						input: input,
						allowedCabangId: allowedCabangId ?? null,
					});
				});

				return result;
			} catch (error) {
				// Handle Prisma Errors yang mungkin lolos dari validasi manual
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2003") {
						// Foreign key violation (misal kelasId/ruangId tidak valid/dihapus saat proses)
						throw new TRPCError({
							code: "BAD_REQUEST",
							message:
								"Terjadi kesalahan referensi data (Kelas atau Ruang mungkin tidak valid).",
						});
					}
				}
				// Lempar error TRPCError yang kita buat manual di atas (CONFLICT, NOT_FOUND)
				throw error;
			}
		}),

	getAllRunning: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const whereClause: Prisma.JadwalKelasWhereInput = {
				kelas: {
					statusKelas: "RUNNING",
					...(filterCabangId ? { cabangId: filterCabangId } : {}),
				},
			};

			return db.jadwalKelas.findMany({
				where: whereClause,
				orderBy: {
					hari: "asc",
				},
				include: {
					jamSlotTetap: true,
					jamSlotCustom: true,
					ruang: {
						select: {
							namaRuang: true,
							cabang: { select: { namaCabang: true } },
						},
					},
					kelas: {
						select: {
							kodeKelas: true,
							jenisKelasRel: { select: { nama: true } },
							deskripsi: true,
							pendaftaranKelases: {
								select: {
									id: true,
									murid: {
										select: {
											namaLengkap: true,
										},
									},
								},
							},
						},
					},
				},
			});
		}),
	getAllWaiting: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const whereClause: Prisma.JadwalKelasWhereInput = {
				kelas: {
					statusKelas: "WAITING",
					...(filterCabangId ? { cabangId: filterCabangId } : {}),
				},
			};

			return db.jadwalKelas.findMany({
				where: whereClause,
				orderBy: {
					hari: "asc",
				},
				include: {
					jamSlotTetap: true,
					jamSlotCustom: true,
					ruang: {
						select: {
							namaRuang: true,
							cabang: { select: { namaCabang: true } },
						},
					},
					kelas: {
						select: {
							kodeKelas: true,
							jenisKelasRel: { select: { nama: true } },
							deskripsi: true,
							pendaftaranKelases: {
								select: {
									id: true,
									murid: {
										select: {
											namaLengkap: true,
										},
									},
								},
							},
						},
					},
				},
			});
		}),
	getAllTrial: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const whereClause: Prisma.JadwalKelasWhereInput = {
				kelas: {
					statusKelas: "TRIAL",
					...(filterCabangId ? { cabangId: filterCabangId } : {}),
				},
			};

			return db.jadwalKelas.findMany({
				where: whereClause,
				orderBy: {
					hari: "asc",
				},
				include: {
					jamSlotTetap: true,
					jamSlotCustom: true,
					ruang: {
						select: {
							namaRuang: true,
							cabang: { select: { namaCabang: true } },
						},
					},
					kelas: {
						select: {
							kodeKelas: true,
							jenisKelasRel: { select: { nama: true } },
							deskripsi: true,
							pendaftaranKelases: {
								select: {
									id: true,
									murid: {
										select: {
											namaLengkap: true,
										},
									},
								},
							},
						},
					},
				},
			});
		}),

	getJadwalHariIniForGuru: cabangProtectedProcedure
		.input(
			z
				.object({
					guruId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { db, session, allowedCabangId } = ctx;
			const targetGuruId = input?.guruId ?? session.user.id;

			const filterCabangId = allowedCabangId;

			// const hariIni = "SABTU" as Hari;
			const now = dayjs().tz(TIMEZONE_BISNIS);
			const hariIni = now.format("dddd").toUpperCase() as Hari;
			const tanggalHariIniStr = now.format("YYYY-MM-DD");

			// 2. Cari semua JadwalKelas untuk guru ini yang aktif hari ini
			const jadwalHariIni = await db.jadwalKelas.findMany({
				where: {
					// Filter berdasarkan hari
					hari: hariIni,
					kelas: {
						...(filterCabangId ? { cabangId: filterCabangId } : {}),
						historyGuruKelases: {
							some: {
								guruId: targetGuruId,
								statusGuru: "ACTIVE",
								mulaiPada: {
									lte: tanggalHariIniStr,
								},
							},
						},
					},
				},
				select: {
					id: true, // ID JadwalKelas (untuk "Mulai Sesi")
					kelasId: true,
					ruangId: true,
					kelas: {
						select: {
							kodeKelas: true,
							historyGuruKelases: {
								where: {
									statusGuru: "ACTIVE",
								},
								select: {
									guru: {
										select: {
											id: true,
											name: true,
										},
									},
								},
								take: 1,
							},
						},
					},
					ruang: {
						select: {
							namaRuang: true,
						},
					},
					// Ambil jam dari kedua kemungkinan sumber
					jamSlotTetap: {
						select: {
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
				orderBy: [
					{ jamSlotTetap: { jamMulai: "asc" } },
					{ jamSlotCustom: { jamMulai: "asc" } },
				],
			});

			// 3. (Opsional tapi Direkomendasikan) Cek sesi yang sudah dibuat hari ini
			const hariIniStart = dayjs().tz(TIMEZONE_BISNIS).startOf("day").toDate();
			const hariIniEnd = dayjs().tz(TIMEZONE_BISNIS).endOf("day").toDate();

			const sesiSudahDibuat = await db.sesiPertemuanKelas.findMany({
				where: {
					jadwalKelasId: {
						in: jadwalHariIni.map((j) => j.id),
					},
					tanggalWaktu: {
						gte: hariIniStart,
						lte: hariIniEnd,
					},
				},
				select: {
					id: true, // ID SesiPertemuanKelas
					jadwalKelasId: true,
				},
			});

			const sesiMap = new Map(
				sesiSudahDibuat.map((s) => [s.jadwalKelasId, s.id]),
			);

			// 4. Proses data agar rapi untuk UI
			const hasil = jadwalHariIni.map((jadwal) => {
				const jam = jadwal.jamSlotTetap ?? jadwal.jamSlotCustom;
				const sesiId = sesiMap.get(jadwal.id) ?? null;
				const guruAktif = jadwal.kelas.historyGuruKelases[0]?.guru;

				return {
					jadwalId: jadwal.id,
					kelasId: jadwal.kelasId,
					ruangId: jadwal.ruangId,
					kodeKelas: jadwal.kelas.kodeKelas,
					namaRuang: jadwal.ruang.namaRuang,
					jamMulai: jam?.jamMulai ?? "N/A",
					jamSelesai: jam?.jamSelesai ?? "N/A",
					guru: guruAktif ? { id: guruAktif.id, name: guruAktif.name } : null,
					sesiIdSudahDibuat: sesiId,
					isJadwalPengganti: targetGuruId !== session.user.id,
				};
			});

			return hasil;
		}),

	delete: cabangProtectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const existingJadwal = await db.jadwalKelas.findUnique({
				where: { id: input.id },
				include: { kelas: { select: { cabangId: true } } },
			});

			if (!existingJadwal) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Jadwal tidak ditemukan atau sudah dihapus.",
				});
			}

			// 2. Validasi Akses
			if (
				allowedCabangId &&
				existingJadwal.kelas.cabangId !== allowedCabangId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus jadwal dari cabang lain.",
				});
			}

			try {
				await db.jadwalKelas.delete({
					where: { id: input.id },
				});
				return { success: true };
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Jadwal tidak ditemukan atau sudah dihapus.",
						});
					}
					// P2003: Jika suatu hari Anda mengubah relasi SesiPertemuan ke RESTRICT
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "PRECONDITION_FAILED",
							message:
								"Jadwal ini sudah memiliki riwayat Sesi Pertemuan dan tidak dapat dihapus.",
						});
					}
				}
				throw error;
			}
		}),

	update: cabangProtectedProcedure
		.input(serverUpdateJadwalSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { id } = input;

			try {
				return await db.$transaction(async (tx) => {
					return updateJadwal({
						tx,
						id,
						input,
						allowedCabangId: allowedCabangId ?? null,
					});
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Referensi data tidak valid (Kelas/Ruang/Jam).",
						});
					}
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Jadwal tidak ditemukan atau sudah dihapus.",
						});
					}
				}
				throw error;
			}
		}),
});
