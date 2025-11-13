import { serverJamSchema } from "@/types/jam.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";

export const jamRouter = createTRPCRouter({
  // Jam Tetap
  getAllJamTetap: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const jams = await db.jamSlotTetap.findMany({
      select: {
        id: true,
        cabangId: true,
        namaSlot: true,
        jamMulai: true,
        jamSelesai: true,
        cabang: {
          select: {
            namaCabang: true,
          },
        },
      },
    });
    return jams;
  }),

  createJamTetap: protectedProcedure
    .input(serverJamSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const newJam = await db.jamSlotTetap.create({
        data: {
          cabangId: input.cabangId,
          namaSlot: input.namaSlot,
          jamMulai: input.jamMulai,
          jamSelesai: input.jamSelesai,
        },
      });
      return newJam;
    }),

  deleteJamTetap: protectedProcedure
    .input(z.object({ id: z.string().min(1, "ID Jam harus diisi") }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      await db.jamSlotTetap.delete({ where: { id: input.id } });
    }),

  updateJamTetap: protectedProcedure
    .input(serverJamSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const updatedJam = await db.jamSlotTetap.update({
        where: { id: input.id },
        data: {
          cabangId: input.cabangId,
          namaSlot: input.namaSlot,
          jamMulai: input.jamMulai,
          jamSelesai: input.jamSelesai,
        },
      });
      return updatedJam;
    }),

  // Jam Custom
  getAllJamCustom: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const jams = await db.jamSlotCustom.findMany({
      select: {
        id: true,
        jamMulai: true,
        jamSelesai: true,
      },
    });
    return jams;
  }),

  createJamCustom: protectedProcedure
    .input(serverJamSchema.omit({ id: true, cabangId: true, namaSlot: true }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const newJam = await db.jamSlotCustom.create({
        data: {
          jamMulai: input.jamMulai,
          jamSelesai: input.jamSelesai,
        },
      });
      return newJam;
    }),

  deleteJamCustom: protectedProcedure
    .input(z.object({ id: z.string().min(1, "ID Jam harus diisi") }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      await db.jamSlotCustom.delete({ where: { id: input.id } });
    }),

  updateJamCustom: protectedProcedure
    .input(serverJamSchema.omit({ cabangId: true, namaSlot: true }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const updatedJam = await db.jamSlotCustom.update({
        where: { id: input.id },
        data: {
          jamMulai: input.jamMulai,
          jamSelesai: input.jamSelesai,
        },
      });
      return updatedJam;
    }),
});
