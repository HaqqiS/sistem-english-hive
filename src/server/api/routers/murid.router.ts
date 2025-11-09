import { RegisterMuridSchema } from "@/types/murid.type";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import z from "zod";
import { StatusMurid } from "@prisma/client";

export const muridRouter = createTRPCRouter({
  registerMurid: publicProcedure
    .input(RegisterMuridSchema)
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;
      const murid = await db.murid.create({
        data: {
          namaLengkap: input.namaLengkap,
          email: input.email,
          alamat: input.alamat,
          gender: input.gender,
          umur: input.umur,
          asalSekolah: input.asalSekolah,
          kelasSekolah: input.kelasSekolah,
          jamPulang: input.jamPulang,
          noWA: input.noWA,
          pilihanProgram: input.pilihanProgram,
          sumberInfo: input.sumberInfo,
          cabangId: input.cabangId,
        },
      });

      return murid;
    }),

  getMuridWhereNotRegistered: protectedProcedure.query(async ({ ctx }) => {
    // Cukup satu kueri ini
    const unregisteredMurid = await ctx.db.murid.findMany({
      where: {
        // Temukan Murid yang tidak memiliki ('none')
        // relasi 'pendaftaranKelas' sama sekali.
        pendaftaranKelases: {
          none: {},
        },
      },
      select: {
        id: true,
        namaLengkap: true,
        pilihanProgram: true,
        statusMurid: true,
        noWA: true,
        jamPulang: true,
      },
    });

    return unregisteredMurid;
  }),

  updateStatusMurid: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        statusMurid: z.nativeEnum(StatusMurid),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;
      const updatedMurid = await db.murid.update({
        where: { id: input.id },
        data: {
          statusMurid: input.statusMurid,
        },
      });
      return updatedMurid;
    }),
});
