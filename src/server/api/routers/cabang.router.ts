import { serverCabangSchema } from "@/types/cabang.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";

export const cabangRouter = createTRPCRouter({
  getAll: protectedProcedure
    // .input(
    //   z.object({
    //     pageSize: z.number(),
    //     pageIndex: z.number(),
    //   }),
    // )
    .query(async ({ ctx }) => {
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
          namaCabang: input.nama,
          alamat: input.alamat,
          noTelp: input.noTelp,
        },
      });
      return cabang;
    }),
});
