import { UserRole } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  serverCreateManyAbsensiGuruSchema,
  serverCreateSesiAbsensiGuruSchema,
} from "@/types/absenGuru.type";
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

  createSesiAndAbsensi: protectedProcedure
    .input(serverCreateSesiAbsensiGuruSchema) // Menggunakan skema array
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const guruId = session.user.id;

      // Gunakan $transaction untuk memastikan keduanya berhasil atau gagal bersamaan
      const result = await db.$transaction(async (tx) => {
        const createdItems = [];

        for (const item of input) {
          // 1. Buat SesiPertemuanKelas
          const newSesi = await tx.sesiPertemuanKelas.create({
            data: {
              kelasId: item.kelasId,
              ruangId: item.ruangId,
              tanggalWaktu: item.tanggalWaktu,
            },
            select: { id: true }, // Hanya ambil ID yang dibutuhkan
          });

          // 2. Buat AbsensiGuru menggunakan ID sesi yang baru
          const newAbsensi = await tx.absensiGuru.create({
            data: {
              guruId: guruId,
              sesiPertemuanKelasId: newSesi.id,
              status: item.status,
              isVerified: false, // Selalu false saat dibuat
            },
          });

          createdItems.push({ sesiId: newSesi.id, absensiId: newAbsensi.id });
        }

        return createdItems;
      });

      return result;
    }),

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
