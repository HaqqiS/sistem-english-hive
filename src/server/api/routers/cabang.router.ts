import { serverCabangSchema } from "@/types/cabang.type";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import z from "zod";
import { paginationSchema } from "@/types/pagination.type";

export const cabangRouter = createTRPCRouter({
  getAllPaginated: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { pageIndex, pageSize } = input;

      const total = await db.cabang.count();
      const cabang = await db.cabang.findMany({
        skip: pageIndex * pageSize,
        take: pageSize,
      });
      const pageCount = Math.ceil(total / pageSize);

      return {
        data: cabang,
        pageCount,
      };
    }),

  getAllList: publicProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const cabang = await db.cabang.findMany();
    return cabang;
  }),

  createCabang: protectedProcedure
    .input(serverCabangSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const cabang = await db.cabang.create({
        data: {
          namaCabang: input.namaCabang,
          alamat: input.alamat,
          noTelp: input.noTelp,
        },
      });
      return cabang;
    }),

  updateCabang: protectedProcedure
    .input(serverCabangSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const cabang = await db.cabang.update({
        where: { id: input.id },
        data: {
          namaCabang: input.namaCabang,
          alamat: input.alamat,
          noTelp: input.noTelp,
        },
      });
      return cabang;
    }),

  deleteCabang: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const cabang = await db.cabang.delete({
        where: { id: input.id },
      });
      return cabang;
    }),
});
