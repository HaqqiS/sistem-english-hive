import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { UserRole } from "@/server/auth/type";

export const finalReportRouter = createTRPCRouter({
	// =========================
	// GET KELAS BY CABANG GURU
	// =========================
	getKelasByCabangGuru: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { cabangId: true },
		});

		if (!user?.cabangId) return [];

		return ctx.db.kelas.findMany({
			where: {
				cabangId: user.cabangId,
				statusKelas: { not: "COMPLETED" },
				historyGuruKelases: {
					some: {
						guruId: ctx.session.user.id,
						selesaiPada: null,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				level: true,
				kodeKelas: true,
				jenisKelasRel: {
					select: { nama: true },
				},
				pendaftaranKelases: {
					where: { status: "AKTIF" },
					select: {
						id: true,
						murid: {
							select: {
								id: true,
								namaLengkap: true,
							},
						},
					},
				},
			},
		});
	}),

	// =========================
	// GET ATTENDANCE BY MURID & KELAS
	// Hitung kehadiran (HADIR) murid di kelas tertentu dari AbsensiMurid
	// =========================
	getAttendanceByMuridKelas: protectedProcedure
		.input(
			z.object({
				muridId: z.string(),
				kelasId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const hadirCount = await ctx.db.absensiMurid.count({
				where: {
					muridId: input.muridId,
					sesiPertemuanKelas: { kelasId: input.kelasId },
					status: "HADIR",
				},
			});

			const totalSesi = await ctx.db.sesiPertemuanKelas.count({
				where: { kelasId: input.kelasId },
			});

			return { hadirCount, totalSesi };
		}),

	// =========================
	// CREATE
	// =========================
	create: protectedProcedure
		.input(
			z.object({
				studentName: z.string(),
				studentId: z.string().optional(),
				level: z.string(),
				midTest: z.number(),
				finalTest: z.number(),
				listening: z.number(),
				speaking: z.number(),
				reading: z.number(),
				writing: z.number(),
				recording: z.number(),
				attendance: z.number(),
				projectParticipation: z.number(),
				finalScore: z.number(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.finalReport.create({
				data: {
					...input,
					teacherUserId: ctx.session.user.id,
					teacherName: ctx.session.user.name ?? "Unknown",
				},
			});
		}),

	// =========================
	// GET ALL
	// MANAGER: semua FR.
	// ADMIN: hanya FR dari guru yang satu cabang dengannya.
	// =========================
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const { role, cabangId } = ctx.session.user;

		// MANAGER melihat semua
		if (role === UserRole.MANAGER) {
			return ctx.db.finalReport.findMany({
				orderBy: { createdAt: "desc" },
			});
		}

		// ADMIN hanya melihat FR guru di cabangnya
		if (!cabangId) return [];

		// Ambil ID semua guru yang terdaftar di cabang ini
		const guruDiCabang = await ctx.db.user.findMany({
			where: { cabangId },
			select: { id: true },
		});
		const guruIds = guruDiCabang.map((g) => g.id);

		return ctx.db.finalReport.findMany({
			where: { teacherUserId: { in: guruIds } },
			orderBy: { createdAt: "desc" },
		});
	}),

	// =========================
	// GET PENDING BY GURU
	// =========================
	getPendingByGuru: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.finalReport.findMany({
			where: {
				teacherUserId: ctx.session.user.id,
				status: "PENDING",
			},
			orderBy: { createdAt: "desc" },
		});
	}),

	// =========================
	// GET APPROVED BY GURU
	// =========================
	getApprovedByGuru: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.finalReport.findMany({
			where: {
				teacherUserId: ctx.session.user.id,
				status: "APPROVED",
				isPrinted: false,
			},
			orderBy: { createdAt: "desc" },
		});
	}),

	// =========================
	// GET CABANG FOR APPROVAL
	// MANAGER: semua cabang (bisa pilih bebas).
	// ADMIN: hanya cabang mereka sendiri.
	// =========================
	getCabangForApproval: protectedProcedure.query(async ({ ctx }) => {
		const { role, cabangId } = ctx.session.user;

		if (role === UserRole.MANAGER) {
			return ctx.db.cabang.findMany({
				select: {
					id: true,
					namaCabang: true,
					alamat: true,
					noTelp: true,
					email: true,
				},
				orderBy: { namaCabang: "asc" },
			});
		}

		// ADMIN: kembalikan hanya cabang sendiri (array satu item, konsisten dengan manager)
		if (!cabangId) return [];

		return ctx.db.cabang.findMany({
			where: { id: cabangId },
			select: {
				id: true,
				namaCabang: true,
				alamat: true,
				noTelp: true,
				email: true,
			},
		});
	}),

	// =========================
	// UPDATE STATUS + CABANG INFO
	// =========================
	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
				cabangNama: z.string().optional(),
				cabangAlamat: z.string().optional(),
				cabangNoTelp: z.string().optional(),
				cabangEmail: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, status, ...cabangData } = input;
			return ctx.db.finalReport.update({
				where: { id },
				data: {
					status,
					...(status === "APPROVED" ? cabangData : {}),
				},
			});
		}),

	// =========================
	// MARK AS PRINTED
	// =========================
	markAsPrinted: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.finalReport.update({
				where: { id: input.id },
				data: { isPrinted: true },
			});
		}),

	// =========================
	// DELETE
	// =========================
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.finalReport.delete({
				where: { id: input.id },
			});
		}),
});
