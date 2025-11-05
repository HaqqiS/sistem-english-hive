import { UserRole } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { serverCreateManyAbsensiGuruSchema } from "@/types/absenGuru.type";
import z from "zod";

export const absenGuruRouter = createTRPCRouter({
  getAllAbsensi: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const result = await db.absensiGuru.findMany({
      select: {
        id: true,
        guruId: true,
        guru: {
          select: {
            name: true,
          },
        },
        sesiPertemuanKelasId: true,
        sesiPertemuanKelas: {
          select: {
            tanggalWaktu: true,
            kelas: {
              select: {
                kodeKelas: true,
              },
            },
          },
        },
        status: true,
        isVerified: true,
        verifiedById: true,
        verifiedBy: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return result;
  }),

  // createAbsensi: protectedProcedure
  //   .input(serverCreateManyAbsensiGuruSchema)
  //   .mutation(async ({ ctx, input }) => {
  //     const { db, session } = ctx;
  //     const guruId = session.user.id;

  //     const dataToCreate = input.map((absensi) => {
  //       return {
  //         guruId,
  //         jadwalSesiId: absensi.jadwalSesiId,
  //         status: absensi.status,

  //         isVerified: false,
  //         verifiedById: null,
  //       };
  //     });

  //     await db.absensiGuru.createMany({
  //       data: dataToCreate,
  //     });
  //   }),

  verifyAbsensi: protectedProcedure
    .input(
      z.object({
        absensiId: z.string(),
        isVerified: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      if ((session.user.role as UserRole) !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
      }

      await db.absensiGuru.update({
        where: {
          id: input.absensiId,
        },
        data: {
          verifiedById: session.user.id,
          isVerified: input.isVerified,
        },
      });
    }),
});
