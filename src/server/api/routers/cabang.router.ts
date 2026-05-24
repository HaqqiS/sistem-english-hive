import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { serverCabangSchema } from "@/types/cabang.type";
import {
	cabangProtectedProcedure,
	createTRPCRouter,
	managerProcedure,
	publicProcedure,
} from "../trpc";

export const cabangRouter = createTRPCRouter({

	getAllForFinalReport: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.cabang.findMany({
			orderBy: { namaCabang: "asc" },
			select: {
				id: true,
				namaCabang: true,
				noTelp: true,
				alamat: true,
				email: true,
			},
		});
	}),

	getAll: cabangProtectedProcedure.query(async ({ ctx }) => {
		const { db, allowedCabangId } = ctx;

		const whereClause: Prisma.CabangWhereInput = {};
		if (allowedCabangId) {
			whereClause.id = allowedCabangId;
		}

		const cabang = await db.cabang.findMany({ where: whereClause });

		return cabang;
	}),

	getCabangList: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.cabang.findMany({
			orderBy: { namaCabang: "asc" },
			select: { id: true, namaCabang: true },
		});
	}),

	createCabang: managerProcedure
		.input(serverCabangSchema)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			try {
				const cabang = await db.cabang.create({
					data: {
						namaCabang: input.namaCabang,
						alamat: input.alamat,
						noTelp: input.noTelp,
						email: input.email ?? null,
						noRekening: input.noRekening,
						bank: input.bank,
						atasNama: input.atasNama,
					},
				});
				return cabang;
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === "P2002"
				) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Cabang dengan nama "${input.namaCabang}" sudah ada.`,
					});
				}
				throw error;
			}
		}),

	updateCabang: managerProcedure
		.input(serverCabangSchema.extend({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			try {
				const cabang = await db.cabang.update({
					where: { id: input.id },
					data: {
						namaCabang: input.namaCabang,
						alamat: input.alamat,
						noTelp: input.noTelp,
						email: input.email ?? null,
						noRekening: input.noRekening,
						bank: input.bank,
						atasNama: input.atasNama,
					},
				});
				return cabang;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Cabang tidak ditemukan.",
						});
					}
					if (error.code === "P2002") {
						throw new TRPCError({
							code: "CONFLICT",
							message: `Nama cabang "${input.namaCabang}" sudah digunakan.`,
						});
					}
				}
				throw error;
			}
		}),

	deleteCabang: managerProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			try {
				const cabang = await db.cabang.delete({
					where: { id: input.id },
				});
				return cabang;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "PRECONDITION_FAILED",
							message:
								"Tidak dapat menghapus cabang ini karena masih memiliki Ruang atau Murid yang terdaftar.",
						});
					}
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Cabang tidak ditemukan",
						});
					}
				}
				throw error;
			}
		}),
});