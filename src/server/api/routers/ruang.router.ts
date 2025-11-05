import type { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { serverRuangSchema } from "@/types/ruang.type";

export const ruangRouter = createTRPCRouter({
  getRuangByCabangId: protectedProcedure
    .input(z.object({ cabangId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const cabangId = input.cabangId;

      const whereClause: Prisma.RuangWhereInput = {};

      // Jika cabangId ada dan bukan "all", filter by cabangId
      if (cabangId && cabangId !== "all") {
        whereClause.cabangId = cabangId;
      }
      const ruang = await db.ruang.findMany({
        where: whereClause,
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

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const ruang = await db.ruang.findMany({
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

  createRuang: protectedProcedure
    .input(serverRuangSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const newRuang = await db.ruang.create({
        data: {
          namaRuang: input.namaRuang,
          cabangId: input.cabangId,
          isAktif: input.isAktif,
        },
      });
      return newRuang;
    }),

  deleteRuang: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const deletedRuang = await db.ruang.delete({
        where: { id: input.id },
      });
      return deletedRuang;
    }),

  updateRuang: protectedProcedure
    .input(serverRuangSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const updatedRuang = await db.ruang.update({
        where: { id: input.id },
        data: {
          namaRuang: input.namaRuang,
          cabangId: input.cabangId,
          isAktif: input.isAktif,
        },
      });
      return updatedRuang;
    }),
});
