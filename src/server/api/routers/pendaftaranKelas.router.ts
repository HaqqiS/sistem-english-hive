import { Prisma, StatusPembayaran, StatusPendaftaran } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import z from "zod";
import {
	calculateInitialBill,
	generateTagihan,
} from "@/server/services/pembayaran.service";
import {
	createBulkPendaftaran,
	createPendaftaran,
	syncMuridStatus,
} from "@/server/services/pendaftaran.service";
import {
	clientBulkUpdateStatusSchema,
	serverBulkPendaftaranKelasSchema,
	serverPendaftaranKelasSchema,
	serverUpdatePendaftaranKelasSchema,
} from "@/types/pendaftaranKelas.type";
import { convertWITAtoUTC } from "@/utils/dateUtils";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";

export const pendaftaranKelasRouter = createTRPCRouter({
	getPendaftarByKelasId: cabangProtectedProcedure
		.input(serverPendaftaranKelasSchema.pick({ kelasId: true }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const kelas = await db.kelas.findUnique({
				where: { id: input.kelasId },
				select: { cabangId: true },
			});

			if (!kelas) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Kelas tidak ditemukan",
				});
			}
			if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Anda tidak berhak melihat pendaftar kelas dari cabang lain.",
				});
			}

			const pendaftaranKelas = await db.pendaftaranKelas.findMany({
				where: {
					kelasId: input.kelasId,
				},
				include: {
					murid: {
						select: {
							id: true,
							namaLengkap: true,
							noWA: true,
							cabangId: true,
							umur: true,
							kelasSekolah: true,
						},
					},
					Kelas: {
						select: {
							kodeKelas: true,
						},
					},
				},
			});

			return pendaftaranKelas;
		}),

	getActivePendaftaranByMuridId: cabangProtectedProcedure
		.input(z.object({ muridId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const pendaftaran = await db.pendaftaranKelas.findMany({
				where: {
					muridId: input.muridId,
					status: { in: [StatusPendaftaran.AKTIF, StatusPendaftaran.TRIAL] },
					Kelas: allowedCabangId ? { cabangId: allowedCabangId } : undefined,
				},
				include: {
					Kelas: {
						select: {
							id: true,
							kodeKelas: true,
							hargaKelas: true,
							level: true,
							jenisKelasRel: {
								select: { hargaBuku: true },
							},
						},
					},
				},
				orderBy: { createdAt: "desc" },
			});

			return pendaftaran;
		}),

	createPendaftaranKelas: cabangProtectedProcedure
		.input(serverPendaftaranKelasSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const [murid, kelas] = await Promise.all([
				db.murid.findUnique({
					where: { id: input.muridId },
					select: { cabangId: true, namaLengkap: true, statusMurid: true },
				}),
				db.kelas.findUnique({
					where: { id: input.kelasId },
					select: {
						cabangId: true,
						hargaKelas: true,
						kodeKelas: true,
						cohortId: true,
						level: true,
						jenisKelasRel: {
							select: { hargaBuku: true, nama: true },
						},
					},
				}),
			]);

			if (!murid || !kelas) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Murid atau Kelas tidak ditemukan.",
				});
			}

			// Map hargaBuku from relation
			const preparedKelas = {
				...kelas,
				hargaBuku: kelas.jenisKelasRel?.hargaBuku ?? 0,
				jenisKelasNama: kelas.jenisKelasRel?.nama ?? "",
			};

			// 2. Validasi Konsistensi Data (Murid & Kelas harus satu cabang)
			if (murid.cabangId !== kelas.cabangId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Konflik Cabang: Murid ${murid.namaLengkap} dan Kelas ${kelas.kodeKelas} berbeda cabang.`,
				});
			}

			// 3. Security Check (Admin)
			if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mendaftarkan siswa di cabang lain.",
				});
			}

			// 4. Cek Apakah Sudah Terdaftar di Kelas Ini (Aktif/Trial)
			const existingRegistration = await db.pendaftaranKelas.findFirst({
				where: {
					muridId: input.muridId,
					kelasId: input.kelasId,
					status: { in: [StatusPendaftaran.AKTIF, StatusPendaftaran.TRIAL] },
				},
			});

			if (existingRegistration) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Murid sudah terdaftar (Aktif/Trial) di kelas ini.",
				});
			}

			try {
				// Validasi Duplikat Pendaftaran Aktif
				// const existingActive = await db.pendaftaranKelas.findFirst({
				// 	where: {
				// 		muridId: input.muridId,
				// 		status: { in: [StatusPendaftaran.AKTIF, StatusPendaftaran.TRIAL] },
				// 	},
				// });
				// if (existingActive) {
				// 	// Gunakan TRPCError dan pesan yang benar
				// 	throw new TRPCError({
				// 		code: "CONFLICT",
				// 		message:
				// 			"Murid ini sudah terdaftar di kelas lain yang masih aktif/trial. Nonaktifkan pendaftaran lama terlebih dahulu.",
				// 	});
				// }

				const jumlahSesiBerlalu = await db.sesiPertemuanKelas.count({
					where: { kelasId: input.kelasId },
				});

				// 4. EKSEKUSI TRANSACTION
				const result = await db.$transaction(async (tx) => {
					return createPendaftaran({
						tx,
						input: {
							...input,
							status: input.status ?? StatusPendaftaran.AKTIF,
						},
						kelas: preparedKelas,
						jumlahSesiBerlalu,
					});
				});

				return result.pendaftaran;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Data Murid atau Kelas tidak valid.",
						});
					}
				}
				throw error;
			}
		}),

	createBulkPendaftaranKelas: cabangProtectedProcedure
		.input(serverBulkPendaftaranKelasSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { muridIds, kelasId } = input;

			const kelas = await db.kelas.findUnique({
				where: { id: kelasId },
				select: {
					hargaKelas: true,
					cabangId: true,
					kodeKelas: true,
					level: true,
					cohortId: true,
					jenisKelasRel: {
						select: { hargaBuku: true, nama: true },
					},
				},
			});
			if (!kelas)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Kelas tidak ditemukan",
				});

			const preparedKelas = {
				...kelas,
				hargaBuku: kelas.jenisKelasRel?.hargaBuku ?? 0,
				jenisKelasNama: kelas.jenisKelasRel?.nama ?? "",
			};

			// Security Check
			if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mendaftarkan siswa di cabang lain.",
				});
			}

			// Validasi Bulk Murid (Semua harus di cabang yang sama)
			const muridCount = await db.murid.count({
				where: {
					id: { in: muridIds },
					cabangId: kelas.cabangId,
				},
			});

			if (muridCount !== muridIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Beberapa murid tidak ditemukan atau berasal dari cabang berbeda.",
				});
			}

			// Validasi Duplikat
			const existingActive = await db.pendaftaranKelas.findMany({
				where: {
					muridId: { in: muridIds },
					status: { in: [StatusPendaftaran.AKTIF, StatusPendaftaran.TRIAL] },
				},
				include: { murid: true },
			});

			if (existingActive.length > 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `Beberapa murid sudah aktif/trial: ${existingActive.map((p) => p.murid.namaLengkap).join(", ")}`,
				});
			}

			const jumlahSesiBerlalu = await db.sesiPertemuanKelas.count({
				where: { kelasId: input.kelasId },
			});

			// Transaction
			try {
				await db.$transaction(
					async (tx) => {
						return createBulkPendaftaran({
							tx,
							input,
							kelas: preparedKelas,
							jumlahSesiBerlalu,
						});
					},
					{ timeout: 20000 },
				);

				return { success: true, count: muridIds.length };
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2002") {
						// Jika ada duplikasi yang lolos validasi manual
						throw new TRPCError({
							code: "CONFLICT",
							message: "Terjadi duplikasi data pendaftaran.",
						});
					}
				}
				throw error;
			}
		}),
	updatePendaftaranKelas: cabangProtectedProcedure
		.input(serverUpdatePendaftaranKelasSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const existingRecord = await db.pendaftaranKelas.findUnique({
				where: { id: input.id },
				include: {
					Kelas: {
						select: {
							cabangId: true,
							cohortId: true,
							level: true,
							hargaKelas: true,
						},
					},
				},
			});

			if (!existingRecord) throw new TRPCError({ code: "NOT_FOUND" });

			// Security Check
			if (
				allowedCabangId &&
				existingRecord.Kelas.cabangId !== allowedCabangId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengedit pendaftaran cabang lain.",
				});
			}

			// Jika ganti kelas, pastikan kelas baru juga di cabang yang sama (kecuali Manager)
			if (input.kelasId && input.kelasId !== existingRecord.kelasId) {
				const targetKelas = await db.kelas.findUnique({
					where: { id: input.kelasId },
					select: { cabangId: true, hargaKelas: true },
				});
				if (!targetKelas)
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Kelas tujuan tidak ditemukan",
					});

				if (allowedCabangId && targetKelas.cabangId !== allowedCabangId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Tidak dapat memindahkan siswa ke kelas di cabang lain.",
					});
				}
			}

			try {
				// 1. Ambil data lama
				const existingRecord = await db.pendaftaranKelas.findUnique({
					where: { id: input.id },
					include: { Kelas: true },
				});

				if (!existingRecord) throw new TRPCError({ code: "NOT_FOUND" });

				return await db.$transaction(async (tx) => {
					// === SKEMA 1: TRANSFER KELAS / GANTI MURID (Hard Change) ===
					// Jika Admin mengubah Kelas atau Murid, kita anggap ini perpindahan.
					// Cara aman: Matikan record lama, buat record baru (agar history bayar lama tetap tercatat di kelas lama).
					if (
						(input.kelasId && input.kelasId !== existingRecord.kelasId) ||
						(input.muridId && input.muridId !== existingRecord.muridId)
					) {
						// 1a. Non-aktifkan pendaftaran lama
						await tx.pendaftaranKelas.update({
							where: { id: input.id },
							data: { status: StatusPendaftaran.NON_AKTIF },
						});

						// 1b. Buat Pendaftaran Baru
						const newRegistration = await tx.pendaftaranKelas.create({
							data: {
								muridId: input.muridId ?? existingRecord.muridId,
								kelasId: input.kelasId ?? existingRecord.kelasId,
								tanggalMulai: input.tanggalMulai, // Tanggal mulai di kelas baru
								status: StatusPendaftaran.AKTIF, // Explicitly AKTIF
							},
						});

						// 1c. Pindahkan Tagihan BELUM LUNAS ke Pendaftaran Baru (Opsional tapi Bagus)
						// Atau buat tagihan baru. Di sini kita buat tagihan transfer simpel.
						const targetKelas = await tx.kelas.findUnique({
							where: { id: input.kelasId ?? existingRecord.kelasId },
						});

						if (targetKelas) {
							await generateTagihan(tx, {
								pendaftaranId: newRegistration.id,
								pembayaranKe: 1,
								jumlahBayar: targetKelas.hargaKelas * 8, // Atau logika prorate
								jatuhTempo: input.tanggalMulai
									? new Date(input.tanggalMulai)
									: new Date(),
								note: "Tagihan Pindahan Kelas / Koreksi Data",
							});
						}

						// 1d. Sinkronisasi status murid (cerdas berdasarkan riwayat)
						await syncMuridStatus(tx, input.muridId ?? existingRecord.muridId);

						return newRegistration; // Return data baru
					}

					// === SKEMA 2 & 3: UPDATE STATUS (Soft Change) ===

					// A. Jika Status Berubah jadi NON-AKTIF (Berhenti)
					if (
						input.status === StatusPendaftaran.NON_AKTIF &&
						existingRecord.status !== StatusPendaftaran.NON_AKTIF
					) {
						// Cleanup 1: Hapus pendaftaran masa depan
						const nextLevelRegistration = await tx.pendaftaranKelas.findFirst({
							where: {
								muridId: existingRecord.muridId,
								Kelas: {
									cohortId: existingRecord.Kelas.cohortId,
									level: { gt: existingRecord.Kelas.level },
								},
								pembayarans: {
									every: { statusBayar: { not: StatusPembayaran.LUNAS } },
								},
							},
						});

						if (nextLevelRegistration) {
							await tx.pendaftaranKelas.delete({
								where: { id: nextLevelRegistration.id },
							});
						}

						// Cleanup 2: Hapus tagihan 'gantung'
						await tx.pembayaran.deleteMany({
							where: {
								pendaftaranKelasId: input.id,
								statusBayar: {
									in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
								},
								note: { contains: "Auto-Generate" },
							},
						});
					}

					// B. Jika Status Berubah: TRIAL/WAITING_LIST -> AKTIF (Upgrade/Activation)
					if (
						(existingRecord.status === StatusPendaftaran.TRIAL ||
							existingRecord.status === StatusPendaftaran.WAITING_LIST) &&
						input.status === StatusPendaftaran.AKTIF
					) {
						// Generate Tagihan SPP Pertama (Karena pas Trial belum buat)
						const jumlahSesiBerlalu = await tx.sesiPertemuanKelas.count({
							where: { kelasId: existingRecord.kelasId },
						});
						const infoTagihan = calculateInitialBill(
							existingRecord.Kelas.hargaKelas,
							jumlahSesiBerlalu,
						);

						// Pastikan tagihan belum ada (prevent duplicate)
						const existingBill = await tx.pembayaran.findFirst({
							where: {
								pendaftaranKelasId: input.id,
								pembayaranKe: infoTagihan.pembayaranKe,
							},
						});

						if (!existingBill) {
							await generateTagihan(tx, {
								pendaftaranId: input.id,
								pembayaranKe: infoTagihan.pembayaranKe,
								jumlahBayar: infoTagihan.totalTagihan,
								jatuhTempo: dayjs(input.tanggalMulai).toDate(),
								note: infoTagihan.note,
							});
						}

						// Update status murid (sync otomatis)
						await syncMuridStatus(tx, existingRecord.muridId);

						// Fallback: Check via relation in Kelas, but we already have existingRecord loaded without relation.
						// Better to fetch fresh if needed, or rely on logic below.
						// Let's safe fetch logic:
						const kelasInfo = await tx.kelas.findUnique({
							where: { id: existingRecord.kelasId },
							include: { jenisKelasRel: true },
						});

						const hargaBuku = kelasInfo?.jenisKelasRel?.hargaBuku ?? 0;
						const namaJenisKelas = kelasInfo?.jenisKelasRel?.nama ?? "";
						const level = kelasInfo?.level ?? 0;

						if (hargaBuku > 0) {
							// Check duplicate
							const existingBookBill = await tx.tagihanLain.findFirst({
								where: {
									muridId: existingRecord.muridId,
									kelasId: existingRecord.kelasId,
									kategori: "BUKU", // Enum string literal KategoriTagihan.BUKU
								},
							});

							if (!existingBookBill) {
								await tx.tagihanLain.create({
									data: {
										muridId: existingRecord.muridId,
										kelasId: existingRecord.kelasId,
										kategori: "BUKU",
										judul: `Buku ${namaJenisKelas} Level ${level}`,
										deskripsi: `Belum Order`,
										jumlah: hargaBuku,
										status: StatusPembayaran.BELUM_LUNAS,
									},
								});
							}
						}
					}

					// C. Tanggal Mulai BERUBAH -> Update Tanggal Jatuh Tempo Tagihan Pertama (jika BELUM LUNAS)
					if (
						input.tanggalMulai &&
						existingRecord.tanggalMulai &&
						input.tanggalMulai !== existingRecord.tanggalMulai
					) {
						const newJatuhTempo = convertWITAtoUTC(input.tanggalMulai);

						await tx.pembayaran.updateMany({
							where: {
								pendaftaranKelasId: input.id,
								pembayaranKe: 1,
								statusBayar: {
									in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
								},
							},
							data: {
								tanggalJatuhTempo: newJatuhTempo,
							},
						});
					}

					// Update Biasa AND Status
					const updateData: Prisma.PendaftaranKelasUpdateInput = {
						tanggalMulai: input.tanggalMulai,
					};
					// Only update status if provided (though schema says optional, logic implies it matters)
					if (input.status) {
						updateData.status = input.status;
					}

					// Sync Murid Status if status changes
					if (input.status) {
						await syncMuridStatus(tx, existingRecord.muridId);
					}

					return tx.pendaftaranKelas.update({
						where: { id: input.id },
						data: updateData,
					});
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Data pendaftaran sudah dihapus.",
						});
					}
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Data Kelas/Murid baru tidak valid.",
						});
					}
				}
				throw error;
			}
		}),

	updateBulkStatus: cabangProtectedProcedure
		.input(clientBulkUpdateStatusSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const { pendaftaranIds, status, tanggalMulai } = input;

			// 1. Validasi: Ambil semua pendaftaran
			const pendaftarans = await db.pendaftaranKelas.findMany({
				where: { id: { in: pendaftaranIds } },
				include: {
					Kelas: {
						select: {
							id: true,
							level: true,
							hargaKelas: true,
							cabangId: true,
							jenisKelasRel: {
								select: { hargaBuku: true, nama: true },
							},
						},
					},
					murid: { select: { id: true, namaLengkap: true } },
				},
			});

			if (pendaftarans.length !== pendaftaranIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Beberapa data pendaftaran tidak ditemukan.",
				});
			}

			// Security Check (One branch only for now)
			const firstCabang = pendaftarans[0]?.Kelas.cabangId;
			if (allowedCabangId && firstCabang !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Akses ditolak.",
				});
			}
			const differentCabang = pendaftarans.some(
				(p) => p.Kelas.cabangId !== firstCabang,
			);
			if (differentCabang) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Bulk update hanya bisa dilakukan dalam satu cabang.",
				});
			}

			// 2. Transaction Loop
			try {
				await db.$transaction(async (tx) => {
					for (const p of pendaftarans) {
						// Skip if status same
						if (p.status === status) continue;

						// Logic Activation (Waiting List / Trial -> Aktif)
						if (
							(p.status === StatusPendaftaran.WAITING_LIST ||
								p.status === StatusPendaftaran.TRIAL) &&
							status === StatusPendaftaran.AKTIF
						) {
							// Generate Bill (SPP)
							const jumlahSesiBerlalu = await tx.sesiPertemuanKelas.count({
								where: { kelasId: p.kelasId },
							});
							const infoTagihan = calculateInitialBill(
								p.Kelas.hargaKelas,
								jumlahSesiBerlalu,
							);

							// Check Duplicate Bill
							const existingBill = await tx.pembayaran.findFirst({
								where: {
									pendaftaranKelasId: p.id,
									pembayaranKe: infoTagihan.pembayaranKe,
								},
							});

							if (!existingBill) {
								await generateTagihan(tx, {
									pendaftaranId: p.id,
									pembayaranKe: infoTagihan.pembayaranKe,
									jumlahBayar: infoTagihan.totalTagihan,
									jatuhTempo: tanggalMulai
										? dayjs(tanggalMulai).toDate()
										: new Date(),
									note: infoTagihan.note,
								});
							}

							// Update Murid Status (handled below via syncMuridStatus)

							// Generate Tagihan Buku (Logic Update Bulk)
							const hargaBuku = p.Kelas.jenisKelasRel?.hargaBuku ?? 0;
							if (hargaBuku > 0) {
								const existingBookBill = await tx.tagihanLain.findFirst({
									where: {
										muridId: p.muridId,
										kelasId: p.kelasId,
										kategori: "BUKU",
									},
								});

								if (!existingBookBill) {
									await tx.tagihanLain.create({
										data: {
											muridId: p.muridId,
											kelasId: p.kelasId,
											kategori: "BUKU",
											judul: `Buku ${p.Kelas.jenisKelasRel?.nama} Level ${p.Kelas.level}`,
											deskripsi: "Belum Order",
											jumlah: hargaBuku,
											status: StatusPembayaran.BELUM_LUNAS,
										},
									});
								}
							}
						} else if (
							p.status === StatusPendaftaran.AKTIF &&
							status === StatusPendaftaran.NON_AKTIF
						) {
							// Logic Deactivation (Optional cleanup)
						}

						// Update Pendaftaran
						await tx.pendaftaranKelas.update({
							where: { id: p.id },
							data: {
								status: status,
								tanggalMulai:
									status === StatusPendaftaran.AKTIF
										? tanggalMulai
										: p.tanggalMulai,
							},
						});

						// Sync Murid Status
						await syncMuridStatus(tx, p.muridId);
					}
				});
				return { success: true, count: pendaftarans.length };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Gagal melakukan update masal.",
					cause: error,
				});
			}
		}),

	deletePendaftaranKelas: cabangProtectedProcedure
		.input(z.object({ id: z.string().cuid() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const existingPendaftaran = await db.pendaftaranKelas.findUnique({
				where: { id: input.id },
				include: { Kelas: { select: { cabangId: true } } },
			});

			if (!existingPendaftaran) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data pendaftaran tidak ditemukan.",
				});
			}

			// Security Check
			if (
				allowedCabangId &&
				existingPendaftaran.Kelas.cabangId !== allowedCabangId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus pendaftaran dari cabang lain.",
				});
			}

			try {
				const exists = await db.pendaftaranKelas.findUnique({
					where: { id: input.id },
				});

				if (!exists) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Data pendaftaran tidak ditemukan.",
					});
				}

				const existingMuridKelas = await db.pendaftaranKelas.findFirst({
					where: { id: input.id },
					select: { muridId: true, kelasId: true },
				});

				if (existingMuridKelas) {
					await db.$transaction(async (tx) => {
						// 1. Bersihkan seluruh data absensi murid yang terkait dengan KELAS INI
						await tx.absensiMurid.deleteMany({
							where: {
								muridId: existingMuridKelas.muridId,
								sesiPertemuanKelas: {
									kelasId: existingMuridKelas.kelasId,
								},
							},
						});

						// 2. Sinkronisasi status murid (secara cerdas mengecek pendaftaran lain)
						await syncMuridStatus(tx, existingMuridKelas.muridId);

						// 3. Hapus pendaftaran kelas itu sendiri
						await tx.pendaftaranKelas.delete({
							where: { id: input.id },
						});
					});
				}

				return { success: true };
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Pendaftaran sudah tidak ada.",
						});
					}
				}
				throw error;
			}
		}),
});
