import { serverSesiPertemuanSchema } from "@/types/sesiPertemuan.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const sesiPertemuanRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const sesiPertemuan = await db.sesiPertemuanKelas.findMany({
      select: {
        id: true,
        kelasId: true,
        kelas: {
          select: {
            kodeKelas: true,
          },
        },
        ruangId: true,
        ruang: { select: { namaRuang: true } },
        tanggalWaktu: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sesiPertemuan;
  }),

  createSesiPertemuan: protectedProcedure
    .input(serverSesiPertemuanSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      // Implementasi pembuatan sesi pertemuan di database
      const newSesiPertemuan = await db.sesiPertemuanKelas.create({
        data: {
          kelasId: input.kelasId,
          ruangId: input.ruangId,
          tanggalWaktu: input.tanggalWaktu,
        },
      });
      return newSesiPertemuan;
    }),
});
