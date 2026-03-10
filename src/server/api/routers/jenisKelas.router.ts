import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { jenisKelasSchema } from "@/types/jenisKelas.type";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";

export const jenisKelasRouter = createTRPCRouter({
	getJenisKelasList: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const whereClause: Prisma.JenisKelasModelWhereInput = {};
			if (allowedCabangId) {
				whereClause.cabangId = allowedCabangId;
			} else if (input?.cabangId) {
				whereClause.cabangId = input.cabangId;
			}

			return await db.jenisKelasModel.findMany({
				where: whereClause,
				include: {
					nextLevel: { select: { nama: true } },
					cabang: { select: { namaCabang: true } },
				},
				orderBy: [{ tipe: "asc" }, { createdAt: "asc" }],
			});
		}),

	createJenisKelas: cabangProtectedProcedure
		.input(jenisKelasSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const finalCabangId = allowedCabangId ?? input.cabangId;

			if (!finalCabangId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cabang ID harus ditentukan.",
				});
			}

			try {
				return await db.jenisKelasModel.create({
					data: {
						nama: input.nama,
						tipe: input.tipe,
						harga: input.harga,
						hargaBuku: input.hargaBuku,
						deskripsi: input.deskripsi,
						nextLevelId: input.nextLevelId,
						cabangId: finalCabangId,
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
			const { db, allowedCabangId } = ctx;

			const existing = await db.jenisKelasModel.findUnique({
				where: { id },
				select: { cabangId: true },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Jenis kelas tidak ditemukan.",
				});
			}

			if (allowedCabangId && existing.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengedit jenis kelas dari cabang lain.",
				});
			}

			if (
				allowedCabangId &&
				data.cabangId &&
				data.cabangId !== allowedCabangId
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak boleh memindahkan jenis kelas ke cabang lain.",
				});
			}

			try {
				return await db.jenisKelasModel.update({
					where: { id },
					data: {
						nama: data.nama,
						tipe: data.tipe,
						harga: data.harga,
						hargaBuku: data.hargaBuku,
						deskripsi: data.deskripsi,
						nextLevelId: data.nextLevelId,
						cabangId: data.cabangId,
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
			const { db, allowedCabangId } = ctx;

			const existing = await db.jenisKelasModel.findUnique({
				where: { id: input.id },
				select: { cabangId: true },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Jenis kelas tidak ditemukan.",
				});
			}

			if (allowedCabangId && existing.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus jenis kelas dari cabang lain.",
				});
			}

			try {
				return await db.jenisKelasModel.delete({
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
