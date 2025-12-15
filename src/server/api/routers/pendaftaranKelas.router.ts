import { Prisma, StatusMurid, StatusPembayaran } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import z from "zod";

import {
	createBulkPendaftaran,
	createPendaftaran,
} from "@/server/services/pendaftaran.service";
import {
	serverBulkPendaftaranKelasSchema,
	serverPendaftaranKelasSchema,
	serverUpdatePendaftaranKelasSchema,
} from "@/types/pendaftaranKelas.type";
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
							namaLengkap: true,
							noWA: true,
							cabangId: true,
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
					},
				}),
			]);

			if (!murid || !kelas) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Murid atau Kelas tidak ditemukan.",
				});
			}

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

			// 4. Cek Apakah Sudah Terdaftar di Kelas Ini (Aktif)
			const existingRegistration = await db.pendaftaranKelas.findFirst({
				where: {
					muridId: input.muridId,
					kelasId: input.kelasId,
					isAktif: true,
				},
			});

			if (existingRegistration) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Murid sudah terdaftar aktif di kelas ini.",
				});
			}

			try {
				// 1. Kita butuh harga kelas untuk tagihan
				const kelas = await db.kelas.findUnique({
					where: { id: input.kelasId },
					select: {
						hargaKelas: true,
						kodeKelas: true,
						cohortId: true,
						level: true,
					},
				});

				if (!kelas) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Kelas yang dipilih tidak ditemukan.",
					});
				}

				// Validasi Duplikat Pendaftaran Aktif
				const existingActive = await db.pendaftaranKelas.findFirst({
					where: { muridId: input.muridId, isAktif: true },
				});
				if (existingActive) {
					// Gunakan TRPCError dan pesan yang benar
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"Murid ini sudah terdaftar di kelas lain yang masih aktif. Nonaktifkan pendaftaran lama terlebih dahulu.",
					});
				}

				const jumlahSesiBerlalu = await db.sesiPertemuanKelas.count({
					where: { kelasId: input.kelasId },
				});

				// 4. EKSEKUSI TRANSACTION
				const result = await db.$transaction(async (tx) => {
					return createPendaftaran({
						tx,
						input,
						kelas,
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
				},
			});
			if (!kelas)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Kelas tidak ditemukan",
				});

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
				where: { muridId: { in: muridIds }, isAktif: true },
				include: { murid: true },
			});

			if (existingActive.length > 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `Beberapa murid sudah aktif: ${existingActive.map((p) => p.murid.namaLengkap).join(", ")}`,
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
							kelas,
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
							data: { isAktif: false },
						});

						// 1b. Buat Pendaftaran Baru
						const newRegistration = await tx.pendaftaranKelas.create({
							data: {
								muridId: input.muridId ?? existingRecord.muridId,
								kelasId: input.kelasId ?? existingRecord.kelasId,
								tanggalMulai: input.tanggalMulai, // Tanggal mulai di kelas baru
								isAktif: true,
							},
						});

						// 1c. Pindahkan Tagihan BELUM LUNAS ke Pendaftaran Baru (Opsional tapi Bagus)
						// Atau buat tagihan baru. Di sini kita buat tagihan transfer simpel.
						const targetKelas = await tx.kelas.findUnique({
							where: { id: input.kelasId ?? existingRecord.kelasId },
						});

						if (targetKelas) {
							await tx.pembayaran.create({
								data: {
									pendaftaranKelasId: newRegistration.id,
									pembayaranKe: 1,
									jumlahBayar: targetKelas.hargaKelas * 8, // Atau logika prorate
									statusBayar: StatusPembayaran.BELUM_LUNAS,
									tanggalJatuhTempo: new Date(input.tanggalMulai),
									note: "Tagihan Pindahan Kelas / Koreksi Data",
								},
							});
						}

						return newRegistration; // Return data baru
					}

					// === SKEMA 2 & 3: UPDATE STATUS (Soft Change) ===

					// A. Jika Status Berubah jadi NON-AKTIF (Berhenti)
					if (input.isAktif === false && existingRecord.isAktif === true) {
						// Cleanup 1: Hapus pendaftaran masa depan (Logic Anda yang sudah bagus)
						const nextLevelRegistration = await tx.pendaftaranKelas.findFirst({
							where: {
								muridId: existingRecord.muridId,
								Kelas: {
									cohortId: existingRecord.Kelas.cohortId,
									level: { gt: existingRecord.Kelas.level },
								},
								// Pastikan hanya menghapus yang belum ada pembayaran lunas
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

						// Cleanup 2: [BARU] Hapus tagihan 'gantung' di level ini
						// Hapus tagihan BELUM LUNAS yang dibuat otomatis (bukan manual) agar tidak jadi piutang macet
						await tx.pembayaran.deleteMany({
							where: {
								pendaftaranKelasId: input.id,
								statusBayar: {
									in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
								},
								note: { contains: "Auto-Generate" }, // Safety: Hanya hapus yg auto
							},
						});
					}

					// B. Jika Status Berubah jadi AKTIF (Re-Join)
					if (input.isAktif === true && existingRecord.isAktif === false) {
						// Opsional: Cek apakah perlu generate tagihan baru?
						// Untuk amannya, biarkan Guru trigger tagihan lewat absensi pertama,
						// atau Admin buat tagihan manual lewat menu Pembayaran.
					}

					// Update Biasa
					return tx.pendaftaranKelas.update({
						where: { id: input.id },
						data: {
							tanggalMulai: input.tanggalMulai,
							isAktif: input.isAktif,
						},
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
					select: { muridId: true },
				});
				if (existingMuridKelas) {
					await db.$transaction(async (tx) => {
						// update status murid yang terkait menjadi 'NON-AKTIF'
						await tx.murid.update({
							where: { id: existingMuridKelas.muridId },
							data: { statusMurid: StatusMurid.NON_AKTIF },
						});
					});
				}

				return db.pendaftaranKelas.delete({
					where: { id: input.id },
				});
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
