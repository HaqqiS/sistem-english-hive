import {
  serverHistoryGuruKelasSchema,
  updateHistoryGuruKelasSchema,
} from "@/types/historyGuruKelas.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";

export const historyGuruKelasRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const historyGuruKelas = await db.historyGuruKelas.findMany({});
    return historyGuruKelas;
  }),

  getHistoryGuruByKelasId: protectedProcedure
    .input(z.object({ kelasId: z.string().min(1, "Kelas ID harus diisi") }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const historyGuruKelas = await db.historyGuruKelas.findMany({
        where: {
          kelasId: input.kelasId,
        },
        include: {
          guru: true,
        },
      });
      return historyGuruKelas;
    }),

  createHistoryGuruKelas: protectedProcedure
    .input(serverHistoryGuruKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const existingGuruRecord = await db.historyGuruKelas.findFirst({
        where: {
          statusGuru: "ACTIVE",
        },
      });

      if (existingGuruRecord) {
        throw new Error(
          "Sudah ada guru yang ditugaskan pada kelas ini dan masih aktif.",
        );
      }
      const newHistoryGuruKelas = await db.historyGuruKelas.create({
        data: {
          kelasId: input.kelasId,
          guruId: input.guruId,
          statusGuru: input.statusGuru,
          mulaiPada: input.mulaiPada,
          selesaiPada: input.selesaiPada,
        },
      });
      return newHistoryGuruKelas;
    }),

  updateHistoryGuruKelas: protectedProcedure
    .input(
      updateHistoryGuruKelasSchema.extend({
        id: z.string().min(1, "ID harus diisi"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const oldRecord = await db.historyGuruKelas.findUnique({
        where: { id: input.id },
      });

      if (input.guruId === oldRecord?.guruId) {
        const updatedRecord = await db.historyGuruKelas.update({
          where: { id: input.id },
          data: {
            // Hanya update fields selain guruId
            mulaiPada: input.mulaiPada,
          },
        });
        return updatedRecord;
      } else {
        // Tutup record lama
        await db.historyGuruKelas.update({
          where: { id: input.id },
          data: {
            selesaiPada: new Date().toISOString().split("T")[0], // format "YYYY-MM-DD"
            statusGuru: "INACTIVE",
          },
        });
        // Buat record baru
        const newRecord = await db.historyGuruKelas.create({
          data: {
            kelasId: oldRecord?.kelasId ?? "",
            guruId: input.guruId,
            statusGuru: "ACTIVE",
            mulaiPada: input.mulaiPada,
          },
        });

        return newRecord;
      }
    }),
});
