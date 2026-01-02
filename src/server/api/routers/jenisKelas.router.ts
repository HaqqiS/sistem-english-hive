import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { jenisKelasSchema } from "@/types/jenisKelas.type";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";

export const jenisKelasRouter = createTRPCRouter({
	getJenisKelasList: cabangProtectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.jenisKelasModel.findMany({
			include: {
				nextLevel: { select: { nama: true } },
			},
			orderBy: [{ tipe: "asc" }, { createdAt: "asc" }],
		});
	}),

	createJenisKelas: cabangProtectedProcedure
		.input(jenisKelasSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.jenisKelasModel.create({
					data: {
						nama: input.nama,
						tipe: input.tipe,
						harga: input.harga,
						hargaBuku: input.hargaBuku,
						deskripsi: input.deskripsi,
						nextLevelId: input.nextLevelId,
					},
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2002") {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Nama jenis kelas sudah ada",
						});
					}
				}
				throw error;
			}
		}),

	updateJenisKelas: cabangProtectedProcedure
		.input(jenisKelasSchema.extend({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			try {
				return await ctx.db.jenisKelasModel.update({
					where: { id },
					data: {
						nama: data.nama,
						tipe: data.tipe,
						harga: data.harga,
						hargaBuku: data.hargaBuku,
						deskripsi: data.deskripsi,
						nextLevelId: data.nextLevelId,
					},
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2002") {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Nama jenis kelas sudah ada",
						});
					}
				}
				throw error;
			}
		}),

	deleteJenisKelas: cabangProtectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.db.jenisKelasModel.delete({
					where: { id: input.id },
				});
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Jenis kelas tidak ditemukan",
						});
					}
				}
				throw error;
			}
		}),
});
