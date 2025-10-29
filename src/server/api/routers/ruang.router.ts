import type { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";

export const ruangRouter = createTRPCRouter({
  getRuangByCabangId: protectedProcedure
    .input(z.object({ cabangId: z.string().nullable() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const cabangId = input.cabangId;

      const whereClause: Prisma.RuangWhereInput = {};

      if (cabangId) {
        whereClause.cabangId = cabangId;
      }

      const ruang = await db.ruang.findMany({
        where: whereClause,
        select: {
          id: true,
          namaRuang: true,
          cabangId: true,
          kodeRuang: true,
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
});
