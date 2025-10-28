import { serverCabangSchema } from "@/types/cabang.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cabangRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
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
