import { Prisma } from "@prisma/client";
import { createTRPCRouter, cabangProtectedProcedure } from "../trpc";
import z from "zod";
import { serverRuangSchema } from "@/types/ruang.type";
import { TRPCError } from "@trpc/server";

export const ruangRouter = createTRPCRouter({
  getAll: cabangProtectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const { db, allowedCabangId } = ctx;

      const whereClause: Prisma.RuangWhereInput = {};
      if (allowedCabangId) whereClause.cabangId = allowedCabangId;

      const ruang = await db.ruang.findMany({
        where: whereClause,
        orderBy: { namaRuang: "asc" },
        select: {
          id: true,
          namaRuang: true,
          cabangId: true,
          isAktif: true,
          createdAt: true,
          updatedAt: true,
          cabang: {
            select: {
              namaCabang: true,
            },
          },
        },
      });
      return ruang;
    }),

  createRuang: cabangProtectedProcedure
    .input(serverRuangSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, allowedCabangId } = ctx;

      // Jika allowedCabangId ada (Admin/Guru), paksa pakai itu.
      // Jika tidak ada (Manager), pakai input.
      const finalCabangId = allowedCabangId ?? input.cabangId;

      if (!finalCabangId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cabang ID harus ditentukan.",
        });
      }

      try {
        const newRuang = await db.ruang.create({
          data: {
            namaRuang: input.namaRuang,
            cabangId: finalCabangId,
            isAktif: input.isAktif,
          },
        });
        return newRuang;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2002: Unik komposit [cabangId, namaRuang]
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Ruang "${input.namaRuang}" sudah ada di cabang ini.`,
            });
          }
          // P2003: Cabang ID tidak valid
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cabang yang dipilih tidak valid.",
            });
          }
        }
        throw error;
      }
    }),

  deleteRuang: cabangProtectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, allowedCabangId } = ctx;

      const existingRuang = await db.ruang.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingRuang) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ruang tidak ditemukan",
        });
      }

      if (allowedCabangId && existingRuang.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak menghapus ruang dari cabang lain.",
        });
      }

      try {
        const deletedRuang = await db.ruang.delete({
          where: { id: input.id },
        });
        return deletedRuang;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2003: Ruang dipakai di Jadwal / Sesi
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "Ruang tidak bisa dihapus karena sedang digunakan dalam Jadwal atau Sesi.",
            });
          }
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Ruang tidak ditemukan",
            });
          }
        }
        throw error;
      }
    }),

  updateRuang: cabangProtectedProcedure
    .input(serverRuangSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, allowedCabangId } = ctx;

      const existingRuang = await db.ruang.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingRuang) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ruang tidak ditemukan.",
        });
      }

      if (allowedCabangId && existingRuang.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mengedit ruang dari cabang lain.",
        });
      }

      if (allowedCabangId && input.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak boleh memindahkan ruang ke cabang lain.",
        });
      }

      try {
        const updatedRuang = await db.ruang.update({
          where: { id: input.id },
          data: {
            namaRuang: input.namaRuang,
            cabangId: input.cabangId,
            isAktif: input.isAktif,
          },
        });
        return updatedRuang;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Ruang tidak ditemukan.",
            });
          }
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Ruang "${input.namaRuang}" sudah ada di cabang ini.`,
            });
          }
        }
        throw error;
      }
    }),
});
