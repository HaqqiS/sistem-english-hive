import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import z from "zod";
import { UserRole } from "@/server/auth/type";
import {
	registerGuruFormSchema,
	updatePasswordFormSchema,
	updateProfileFormSchema,
} from "@/types/user.type";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";

export const userRouter = createTRPCRouter({
	getGuruList: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			return await db.user.findMany({
				where: {
					role: UserRole.GURU,
					...(filterCabangId ? { cabangId: filterCabangId } : {}),
				},
				orderBy: { name: "asc" },
				select: {
					id: true,
					name: true,
					cabangId: true, // Opsional: untuk validasi di frontend
				},
			});
		}),

	getAllGuruComplete: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// 1. Security Filter
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const whereClause: Prisma.UserWhereInput = {
				role: UserRole.GURU,
			};

			if (filterCabangId) whereClause.cabangId = filterCabangId;

			const gurus = await db.user.findMany({
				where: whereClause,
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					cabang: { select: { namaCabang: true } },
				},
			});

			return gurus;
		}),

	createGuru: cabangProtectedProcedure
		.input(registerGuruFormSchema.extend({ cabangId: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const finalCabangId = allowedCabangId ?? input.cabangId;

			if (!finalCabangId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cabang harus ditentukan untuk mendaftarkan Guru.",
				});
			}

			try {
				const hashPassword = await bcrypt.hash(input.password, 12);

				const newGuru = await db.user.create({
					data: {
						name: input.name,
						email: input.email,
						password: hashPassword,
						cabangId: finalCabangId,
						role: UserRole.GURU,
					},
				});
				return newGuru;
			} catch (error) {
				// Tangani Duplikat Email
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2002") {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Email sudah terdaftar. Gunakan email lain.",
						});
					}
				}
				throw error;
			}
		}),

	updateGuru: cabangProtectedProcedure
		.input(
			registerGuruFormSchema
				.extend({
					id: z.string().cuid(),
				})
				.omit({ password: true }),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// 1. Cek Kepemilikan (Ownership Check)
			const existingGuru = await db.user.findUnique({
				where: { id: input.id },
				select: { cabangId: true },
			});

			if (!existingGuru) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data guru tidak ditemukan",
				});
			}

			// 2. Validasi Akses Cabang
			if (allowedCabangId && existingGuru.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengedit data guru dari cabang lain.",
				});
			}

			try {
				const updatedGuru = await db.user.update({
					where: { id: input.id },
					data: {
						name: input.name,
						email: input.email,
					},
				});
				return updatedGuru;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					// P2025: Record to update not found
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Data guru tidak ditemukan",
						});
					}
					// P2002: Email baru bentrok dengan user lain
					if (error.code === "P2002") {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Email baru ini sudah digunakan user lain",
						});
					}
				}
				throw error;
			}
		}),

	resetPasswordGuru: cabangProtectedProcedure
		.input(z.object({ id: z.string().cuid() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// 1. Cek Kepemilikan
			const existingGuru = await db.user.findUnique({
				where: { id: input.id },
				select: { cabangId: true },
			});

			if (!existingGuru) throw new TRPCError({ code: "NOT_FOUND" });

			if (allowedCabangId && existingGuru.cabangId !== allowedCabangId) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Akses ditolak." });
			}
			// Set password default to 'password123'
			const defaultPassword = "password123";
			const hashPassword = await bcrypt.hash(defaultPassword, 10);
			const updatedGuru = await db.user.update({
				where: { id: input.id },
				data: {
					password: hashPassword,
				},
			});
			return updatedGuru;
		}),

	changePasswordGuru: cabangProtectedProcedure
		.input(z.object({ id: z.string().cuid(), newPassword: z.string().min(8) }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const existingUser = await db.user.findUnique({
				where: { id: input.id },
				select: { cabangId: true },
			});

			if (!existingUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User tidak ditemukan.",
				});
			}

			if (allowedCabangId && existingUser.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengubah password user dari cabang lain.",
				});
			}

			const hashPassword = await bcrypt.hash(input.newPassword, 10);
			const updatedGuru = await db.user.update({
				where: { id: input.id },
				data: {
					password: hashPassword,
				},
			});
			return updatedGuru;
		}),

	deleteGuru: cabangProtectedProcedure
		.input(z.object({ id: z.string().cuid() }))
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			// 1. Cek Kepemilikan
			const existingGuru = await db.user.findUnique({
				where: { id: input.id },
				select: { cabangId: true },
			});

			if (!existingGuru) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Guru sudah dihapus atau tidak ditemukan",
				});
			}

			// 2. Validasi Akses
			if (allowedCabangId && existingGuru.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus guru dari cabang lain.",
				});
			}

			try {
				const result = await db.user.delete({
					where: { id: input.id },
				});
				return result;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Guru sudah dihapus atau tidak ditemukan",
						});
					}
					// P2003: Foreign Key constraint (Misal guru masih punya jadwal aktif)
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "PRECONDITION_FAILED",
							message:
								"Guru tidak bisa dihapus karena masih memiliki data terkait (Jadwal/Absensi). Non-aktifkan saja statusnya.",
						});
					}
				}
				throw error;
			}
		}),

	// --- SELF UPDATE MUTATIONS ---
	updateMyProfileSelf: cabangProtectedProcedure
		.input(updateProfileFormSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			// Update diri sendiri (session.user.id)
			const userId = session.user.id;

			try {
				const updatedUser = await db.user.update({
					where: { id: userId },
					data: {
						name: input.name,
						email: input.email,
					},
				});
				return updatedUser;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2002") {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Email ini sudah digunakan user lain.",
						});
					}
				}
				throw error;
			}
		}),

	updateMyPasswordSelf: cabangProtectedProcedure
		.input(updatePasswordFormSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const userId = session.user.id;

			// 1. Ambil password lama
			const user = await db.user.findUnique({
				where: { id: userId },
			});

			if (!user || !user.password) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User tidak valid atau belum memiliki password.",
				});
			}

			// 2. Verifikasi Password Lama
			const isPasswordValid = await bcrypt.compare(
				input.currentPassword,
				user.password,
			);

			if (!isPasswordValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Kata sandi saat ini salah.",
				});
			}

			// 3. Update Password Baru
			const hashPassword = await bcrypt.hash(input.newPassword, 12);

			await db.user.update({
				where: { id: userId },
				data: {
					password: hashPassword,
				},
			});

			return { success: true, message: "Kata sandi berhasil diubah." };
		}),

	getJadwalMatrix: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			// 1. Fetch Global Jam Slot Tetap
			const jamTetap = await db.jamSlotTetap.findMany({
				where: filterCabangId ? { cabangId: filterCabangId } : {},
				orderBy: [{ namaSlot: "asc" }, { jamMulai: "asc" }],
			});

			// 2. Fetch Guru & Their Active Schedules
			const gurus = await db.user.findMany({
				where: {
					role: UserRole.GURU,
					...(filterCabangId ? { cabangId: filterCabangId } : {}),
				},
				orderBy: { name: "asc" },
				select: {
					id: true,
					name: true,
					historyGuruKelases: {
						where: { statusGuru: "ACTIVE" },
						select: {
							kelas: {
								select: {
									id: true,
									kodeKelas: true,
									statusKelas: true,
									jadwalKelas: {
										select: {
											hari: true,
											jamSlotTetap: true,
											jamSlotCustom: true,
										},
									},
								},
							},
						},
					},
				},
			});

			return {
				gurus,
				jamTetap,
			};
		}),
});
