import { serverJamSchema } from "@/types/jam.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";

export const jamRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
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

  createJam: protectedProcedure
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

  deleteJam: protectedProcedure
    .input(z.object({ id: z.string().min(1, "ID Jam harus diisi") }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      await db.jamSlotTetap.delete({ where: { id: input.id } });
    }),

  updateJam: protectedProcedure
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
});
