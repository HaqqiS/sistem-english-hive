import {
  RegisterMuridSchema,
  updateStatusMuridSchema,
} from "@/types/murid.type";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import z from "zod";
import { Prisma, StatusMurid } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const muridRouter = createTRPCRouter({
  registerMurid: publicProcedure
    .input(RegisterMuridSchema)
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;

      try {
        // Coba buat murid baru
        const murid = await db.murid.create({
          data: {
            ...input,
          },
        });
        return murid;
      } catch (error) {
        // --- INI ADALAH PENANGANAN ERROR YANG BARU ---

        // 1. Cek apakah ini error yang diketahui dari Prisma
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // 2. Cek apakah kodenya adalah 'P2002' (Unique constraint failed)
          if (error.code === "P2002") {
            // 3. Cari tahu field mana yang duplikat
            const target = error.meta?.target as string[];

            if (target.includes("email")) {
              throw new TRPCError({
                code: "CONFLICT", // 'CONFLICT' (409) adalah kode yang tepat
                message:
                  "Email ini sudah terdaftar. Silakan gunakan email lain.",
              });
            }
            if (target.includes("noWA")) {
              throw new TRPCError({
                code: "CONFLICT",
                message:
                  "Nomor WhatsApp ini sudah terdaftar. Silakan gunakan nomor lain.",
              });
            }
          }
        }

        // 4. Jika error lain, lempar error server internal
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendaftarkan murid. Silakan coba lagi nanti.",
        });
      }
    }),

  getAllMurid: protectedProcedure.query(async ({ ctx }) => {
    const allMurid = await ctx.db.murid.findMany();
    return allMurid;
  }),

  getMuridWhereNotRegistered: protectedProcedure.query(async ({ ctx }) => {
    // Cukup satu kueri ini
    const unregisteredMurid = await ctx.db.murid.findMany({
      where: {
        OR: [
          // Tidak punya pendaftaran sama sekali
          {
            pendaftaranKelases: {
              none: {},
            },
          },
          // Punya pendaftaran, tapi semuanya isAktif: false
          {
            pendaftaranKelases: {
              every: {
                isAktif: false,
              },
            },
          },
        ],
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
    .input(updateStatusMuridSchema)
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

  updateMurid: protectedProcedure
    .input(
      RegisterMuridSchema.extend({
        id: z.string().cuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;
      const { id, ...data } = input;
      const updatedMurid = await db.murid.update({
        where: { id },
        data,
      });
      return updatedMurid;
    }),

  deleteMurid: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;
      const deletedMurid = await db.murid.delete({
        where: { id: input.id },
      });
      return deletedMurid;
    }),
});
