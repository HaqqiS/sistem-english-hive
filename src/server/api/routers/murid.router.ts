import {
  RegisterMuridSchema,
  updateStatusMuridSchema,
} from "@/types/murid.type";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import z from "zod";
import { Prisma, StatusMurid } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { paginationSchema } from "@/types/pagination.type";
import { getRestrictedCabangId } from "@/server/utils/permission";

export const muridRouter = createTRPCRouter({
  registerMurid: publicProcedure
    .input(RegisterMuridSchema)
    .mutation(async ({ input, ctx }) => {
      const { db, session } = ctx;

      const finalCabangId = getRestrictedCabangId(session, input.cabangId);
      if (!finalCabangId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cabang ID diperlukan untuk pendaftaran.",
        });
      }

      try {
        const murid = await db.murid.create({
          data: {
            ...input,
            cabangId: finalCabangId,
          },
        });
        return murid;
      } catch (error) {
        throw error;
      }
    }),

  getAllMurid: protectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const filterCabangId = getRestrictedCabangId(session, input?.cabangId);

      const whereClause: Prisma.MuridWhereInput = {};
      if (filterCabangId) whereClause.cabangId = filterCabangId;

      const allMurid = await db.murid.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
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
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
        status: z.nativeEnum(StatusMurid).optional(),
        cabangId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { pageIndex, pageSize, search, status } = input;

      const filterCabangId = getRestrictedCabangId(session, input.cabangId);

      const whereClause: Prisma.MuridWhereInput = {};

      if (search) {
        whereClause.namaLengkap = {
          contains: search,
          mode: "insensitive",
        };
      }
      if (status) whereClause.statusMurid = status;
      if (filterCabangId) whereClause.cabangId = filterCabangId;

      // Gunakan transaction untuk performa (count + findMany paralel)
      const [total, data] = await db.$transaction([
        db.murid.count({ where: whereClause }),
        db.murid.findMany({
          skip: pageIndex * pageSize,
          take: pageSize,
          where: whereClause,
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

  getMuridWhereNotRegistered: protectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const filterCabangId = getRestrictedCabangId(session, input?.cabangId);

      const whereClause: Prisma.MuridWhereInput = {
        OR: [
          { pendaftaranKelases: { none: {} } },
          { pendaftaranKelases: { every: { isAktif: false } } },
        ],
      };

      if (filterCabangId) whereClause.cabangId = filterCabangId;

      const unregisteredMurid = await db.murid.findMany({
        where: whereClause,
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

  getForExport: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.nativeEnum(StatusMurid).optional(),
        cabangId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const filterCabangId = getRestrictedCabangId(session, input.cabangId);

      const whereClause: Prisma.MuridWhereInput = {};
      if (input.search) {
        whereClause.namaLengkap = {
          contains: input.search,
          mode: "insensitive",
        };
      }
      if (input.status) whereClause.statusMurid = input.status;
      if (filterCabangId) whereClause.cabangId = filterCabangId;

      // Ambil data untuk CSV (Pilih field yang relevan untuk marketing/db)
      return await db.murid.findMany({
        where: whereClause,
        orderBy: { namaLengkap: "asc" },
      });
    }),

  getMuridNotRegisteredPaginated: protectedProcedure
    .input(paginationSchema.extend({ cabangId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { pageIndex, pageSize } = input;

      const filterCabangId = getRestrictedCabangId(session, input.cabangId);

      // Definisikan where clause agar konsisten untuk count dan findMany
      const whereClause: Prisma.MuridWhereInput = {
        OR: [
          { pendaftaranKelases: { none: {} } },
          { pendaftaranKelases: { every: { isAktif: false } } },
        ],
      };
      if (filterCabangId) whereClause.cabangId = filterCabangId;

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
      const { db, session } = ctx;

      const existingMurid = await db.murid.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingMurid) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data murid tidak ditemukan.",
        });
      }

      const allowedCabangId = getRestrictedCabangId(session, null);

      if (allowedCabangId && existingMurid.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mengubah murid dari cabang lain.",
        });
      }
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
      const { db, session } = ctx;
      const { id, ...data } = input;

      const existingMurid = await db.murid.findUnique({
        where: { id },
        select: { cabangId: true },
      });

      if (!existingMurid) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data murid tidak ditemukan.",
        });
      }

      // 2. Validasi Akses Cabang
      const allowedCabangId = getRestrictedCabangId(session, null);

      if (allowedCabangId && existingMurid.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mengedit murid dari cabang lain.",
        });
      }

      // 3. Validasi tambahan: Jangan biarkan Admin memindahkan siswa ke cabang lain
      // (Manager boleh memindahkan jika perlu)
      if (allowedCabangId && data.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak boleh memindahkan siswa ke cabang lain.",
        });
      }

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
      const { db, session } = ctx;

      const existingMurid = await db.murid.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingMurid) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Murid tidak ditemukan.",
        });
      }

      // 2. Validasi Akses
      const allowedCabangId = getRestrictedCabangId(session, null);

      if (allowedCabangId && existingMurid.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak menghapus murid dari cabang lain.",
        });
      }

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
