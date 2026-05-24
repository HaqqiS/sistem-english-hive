import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const finalReportRouter = createTRPCRouter({
	// =========================
	// GET KELAS BY CABANG GURU
	// Ambil semua kelas aktif di cabang guru yang sedang login
	// Include murid yang terdaftar di kelas tersebut
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
						selesaiPada: null, // masih aktif mengajar
					},
				},
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				level: true,
				kodeKelas: true,
				jenisKelasRel: {
					select: {
						nama: true,
					},
				},
				pendaftaranKelases: {
					where: { status: "AKTIF" },
					select: {
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
	// CREATE
	// =========================
	create: protectedProcedure
		.input(
			z.object({
				studentName: z.string(),
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
	// =========================
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.finalReport.findMany({
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
	// GET ALL CABANG (untuk dropdown admin)
	// =========================
	getAllCabang: protectedProcedure.query(async ({ ctx }) => {
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
