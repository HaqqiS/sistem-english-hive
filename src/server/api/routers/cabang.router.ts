import { serverCabangSchema } from "@/types/cabang.type";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import z from "zod";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getRestrictedCabangId } from "@/server/utils/permission";

export const cabangRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, session } = ctx;

    const allowedCabangId = getRestrictedCabangId(session, null);

    const whereClause: Prisma.CabangWhereInput = {};
    if (allowedCabangId) {
      whereClause.id = allowedCabangId;
    }

    const cabang = await db.cabang.findMany({ where: whereClause });

    return cabang;
  }),

  getAllList: publicProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const cabang = await db.cabang.findMany({
      select: { id: true, namaCabang: true },
    });
    return cabang;
  }),

  createCabang: protectedProcedure
    .input(serverCabangSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      try {
        const cabang = await db.cabang.create({
          data: {
            namaCabang: input.namaCabang,
            alamat: input.alamat,
            noTelp: input.noTelp,
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

  updateCabang: protectedProcedure
    .input(serverCabangSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const allowedCabangId = getRestrictedCabangId(session, null);

      if (allowedCabangId && input.id !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mengubah data cabang lain."
        });
      }

      try {
        const cabang = await db.cabang.update({
          where: { id: input.id },
          data: {
            namaCabang: input.namaCabang,
            alamat: input.alamat,
            noTelp: input.noTelp,
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

  deleteCabang: protectedProcedure
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
            // Foreign Key Violation
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
