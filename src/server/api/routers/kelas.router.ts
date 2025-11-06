import { serverKelasSchema } from "@/types/kelas.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";

export const kelasRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const kelas = await ctx.db.kelas.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        jenisKelas: true,
        level: true,
        grup: true,
        tipe: true,
        kodeKelas: true,
        bulanTahunAjar: true,
        deskripsi: true,
        hargaKelas: true,
        historyGuruKelases: {
          where: {
            selesaiPada: null,
          },
          select: {
            id: true,
            kelasId: true,
            guruId: true,
            statusGuru: true,
            mulaiPada: true,
            selesaiPada: true,
            guru: {
              select: {
                name: true,
              },
            },
          },
        },
      },
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

  updateKelas: protectedProcedure
    .input(serverKelasSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const kelas = await db.kelas.update({
        where: { id: input.id },
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

  deleteKelas: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const kelas = await db.kelas.delete({
        where: { id: input.id },
      });
      return kelas;
    }),
});
