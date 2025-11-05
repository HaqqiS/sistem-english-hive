import { serverPendaftaranKelasSchema } from "@/types/pendaftaranKelas.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const pendaftaranKelasRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const pendaftaranKelas = await ctx.db.pendaftaranKelas.findMany({
      include: {
        murid: {
          select: {
            namaLengkap: true,
            email: true,
          },
        },
        Kelas: {
          select: {
            kodeKelas: true,
          },
        },
      },
    });

    return pendaftaranKelas;
  }),

  getPendaftarByKelasId: protectedProcedure
    .input(serverPendaftaranKelasSchema.pick({ kelasId: true }))
    .query(async ({ ctx, input }) => {
      const pendaftaranKelas = await ctx.db.pendaftaranKelas.findMany({
        where: {
          kelasId: input.kelasId,
        },
        include: {
          murid: {
            select: {
              namaLengkap: true,
              email: true,
            },
          },
          Kelas: {
            select: {
              kodeKelas: true,
            },
          },
        },
      });

      return pendaftaranKelas;
    }),

  createPendaftaranKelas: protectedProcedure
    .input(serverPendaftaranKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const newPendaftaranKelas = await ctx.db.pendaftaranKelas.create({
        data: {
          ...input,
          isAktif: true,
        },
      });
      return newPendaftaranKelas;
    }),
});
