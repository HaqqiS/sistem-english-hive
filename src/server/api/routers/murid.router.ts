import {
  RegisterMuridSchema,
  updateStatusMuridSchema,
} from "@/types/murid.type";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import z from "zod";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { paginationSchema } from "@/types/pagination.type";

export const muridRouter = createTRPCRouter({
  registerMurid: publicProcedure
    .input(RegisterMuridSchema)
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;

      try {
        const murid = await db.murid.create({
          data: {
            ...input,
          },
        });
        return murid;
      } catch (error) {
        throw error;
      }
    }),

  getAllMurid: protectedProcedure.query(async ({ ctx }) => {
    const allMurid = await ctx.db.murid.findMany({
      orderBy: { createdAt: "desc" }, // Tambahkan order agar rapi
    });
    return allMurid;
  }),

  getMuridById: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await ctx.db.murid.findUnique({
        where: { id: input.id },
      });
    }),

  getAllPaginated: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { pageIndex, pageSize } = input;

      // Gunakan transaction untuk performa (count + findMany paralel)
      const [total, data] = await db.$transaction([
        db.murid.count(),
        db.murid.findMany({
          skip: pageIndex * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const pageCount = Math.ceil(total / pageSize);

      return {
        data,
        pageCount,
        total,
      };
    }),

  getMuridWhereNotRegistered: protectedProcedure.query(async ({ ctx }) => {
    const unregisteredMurid = await ctx.db.murid.findMany({
      where: {
        OR: [
          { pendaftaranKelases: { none: {} } },
          { pendaftaranKelases: { every: { isAktif: false } } },
        ],
      },
      select: {
        id: true,
        kelasSekolah: true,
        umur: true,
        namaLengkap: true,
        pilihanProgram: true,
        statusMurid: true,
        noWA: true,
        jamPulang: true,
      },
    });
    return unregisteredMurid;
  }),

  getMuridNotRegisteredPaginated: protectedProcedure
    .input(paginationSchema) // Input: pageIndex, pageSize
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { pageIndex, pageSize } = input;

      // Definisikan where clause agar konsisten untuk count dan findMany
      const whereClause: Prisma.MuridWhereInput = {
        OR: [
          { pendaftaranKelases: { none: {} } },
          { pendaftaranKelases: { every: { isAktif: false } } },
        ],
      };

      // Transaction untuk performa (count + query data paralel)
      const [total, data] = await db.$transaction([
        db.murid.count({ where: whereClause }),
        db.murid.findMany({
          skip: pageIndex * pageSize,
          take: pageSize,
          where: whereClause,
          orderBy: { namaLengkap: "asc" }, // Urutkan berdasarkan nama
          select: {
            id: true,
            kelasSekolah: true,
            umur: true,
            namaLengkap: true,
            pilihanProgram: true,
            statusMurid: true,
            noWA: true,
            jamPulang: true,
          },
        }),
      ]);

      const pageCount = Math.ceil(total / pageSize);

      return {
        data,
        pageCount,
        total,
      };
    }),

  updateStatusMurid: protectedProcedure
    .input(updateStatusMuridSchema)
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;
      try {
        const updatedMurid = await db.murid.update({
          where: { id: input.id },
          data: {
            statusMurid: input.statusMurid,
          },
        });
        return updatedMurid;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Data murid tidak ditemukan.",
            });
          }
        }
        throw error;
      }
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
      try {
        const updatedMurid = await db.murid.update({
          where: { id },
          data,
        });
        return updatedMurid;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Data murid tidak ditemukan.",
            });
          }
        }
        throw error;
      }
    }),

  deleteMurid: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;
      try {
        const deletedMurid = await db.murid.delete({
          where: { id: input.id },
        });
        return deletedMurid;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Murid sudah dihapus atau tidak ditemukan.",
            });
          }
          // P2003: Foreign Key (Jika murid punya data nilai/history yg restrict)
          // Meski schema Anda 'Cascade', tetap baik di-handle jika suatu saat diubah
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "Murid tidak bisa dihapus karena memiliki data terkait yang tidak bisa dihapus otomatis.",
            });
          }
        }
        throw error;
      }
    }),
});
