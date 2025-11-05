import { serverKelasSchema } from "@/types/kelas.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";

export const kelasRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const kelas = await ctx.db.kelas.findMany({
      orderBy: { createdAt: "desc" },
    });
    return kelas;
  }),

  getKelasById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const kelas = await ctx.db.kelas.findUnique({
        where: { id: input.id },
      });
      return kelas;
    }),

  createKelas: protectedProcedure
    .input(serverKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const kelas = await db.kelas.create({
        data: {
          jenisKelas: input.jenisKelas,
          level: input.level,
          grup: input.grup,
          tipe: input.tipe,
          kodeKelas: input.kodeKelas,
          bulanTahunAjar: input.bulanTahunAjar,
          deskripsi: input.deskripsi,
          hargaKelas: input.hargaKelas,
        },
      });
      return kelas;
    }),
});
