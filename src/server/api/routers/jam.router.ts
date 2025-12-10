import { serverJamSchema } from "@/types/jam.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getRestrictedCabangId } from "@/server/utils/permission";

export const jamRouter = createTRPCRouter({
  // Jam Tetap
  getAllJamTetap: protectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const filterCabangId = getRestrictedCabangId(session, input?.cabangId);

      const whereClause: Prisma.JamSlotTetapWhereInput = {};
      if (filterCabangId) {
        whereClause.cabangId = filterCabangId;
      }

      return await db.jamSlotTetap.findMany({
        where: whereClause,
        include: {
          cabang: { select: { namaCabang: true } },
        },
      });
    }),

  createJamTetap: protectedProcedure
    .input(serverJamSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const finalCabangId = getRestrictedCabangId(session, input.cabangId);

      if (!finalCabangId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cabang ID harus ditentukan.",
        });
      }

      try {
        const newJam = await db.jamSlotTetap.create({
          data: {
            cabangId: finalCabangId,
            namaSlot: input.namaSlot,
            jamMulai: input.jamMulai,
            jamSelesai: input.jamSelesai,
          },
        });
        return newJam;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2003: Foreign Key Error (Cabang ID tidak valid)
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cabang tidak ditemukan atau ID tidak valid.",
            });
          }
        }
        throw error;
      }
    }),

  deleteJamTetap: protectedProcedure
    .input(z.object({ id: z.string().min(1, "ID Jam harus diisi") }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // 1. Cek Kepemilikan
      const existingJam = await db.jamSlotTetap.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingJam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Slot jam tidak ditemukan.",
        });
      }

      // 2. Validasi Akses
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && existingJam.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak menghapus slot jam dari cabang lain.",
        });
      }

      try {
        await db.jamSlotTetap.delete({ where: { id: input.id } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Jam tetap tidak ditemukan atau sudah dihapus.",
            });
          }
          // P2003: Delete Restricted (Masih dipakai di JadwalKelas)
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "Tidak dapat menghapus jam ini karena sedang digunakan oleh Jadwal Kelas. Hapus jadwal terkait terlebih dahulu.",
            });
          }
        }
        throw error;
      }
    }),

  updateJamTetap: protectedProcedure
    .input(serverJamSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // 1. Cek Kepemilikan
      const existingJam = await db.jamSlotTetap.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingJam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Slot jam tidak ditemukan.",
        });
      }

      // 2. Validasi Akses
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && existingJam.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mengedit slot jam dari cabang lain.",
        });
      }

      // Prevent Admin memindahkan slot ke cabang lain
      if (
        allowedCabangId &&
        input.cabangId &&
        input.cabangId !== allowedCabangId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak boleh memindahkan slot jam ke cabang lain.",
        });
      }
      try {
        const updatedJam = await db.jamSlotTetap.update({
          where: { id: input.id },
          data: {
            namaSlot: input.namaSlot,
            jamMulai: input.jamMulai,
            jamSelesai: input.jamSelesai,
            ...(input.cabangId ? { cabangId: input.cabangId } : {}),
          },
        });
        return updatedJam;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Jam tetap tidak ditemukan.",
            });
          }
        }
        throw error;
      }
    }),

  // ================= JAM CUSTOM =================
  getAllJamCustom: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    return await db.jamSlotCustom.findMany({
      orderBy: { jamMulai: "asc" },
    });
  }),

  createJamCustom: protectedProcedure
    .input(serverJamSchema.omit({ id: true, cabangId: true, namaSlot: true }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      try {
        const newJam = await db.jamSlotCustom.create({
          data: {
            jamMulai: input.jamMulai,
            jamSelesai: input.jamSelesai,
          },
        });
        return newJam;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2002: Unique Constraint (Kombinasi Jam Mulai & Selesai sudah ada)
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Jam Custom ${input.jamMulai} - ${input.jamSelesai} sudah ada di database.`,
            });
          }
        }
        throw error;
      }
    }),

  deleteJamCustom: protectedProcedure
    .input(z.object({ id: z.string().min(1, "ID Jam harus diisi") }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      try {
        await db.jamSlotCustom.delete({ where: { id: input.id } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Jam custom tidak ditemukan.",
            });
          }
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2003") {
              throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message:
                  "Slot custom ini sedang dipakai dan tidak bisa dihapus.",
              });
            }
          }
        }
        throw error;
      }
    }),

  updateJamCustom: protectedProcedure
    .input(serverJamSchema.omit({ cabangId: true, namaSlot: true }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      try {
        const updatedJam = await db.jamSlotCustom.update({
          where: { id: input.id },
          data: {
            jamMulai: input.jamMulai,
            jamSelesai: input.jamSelesai,
          },
        });
        return updatedJam;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Jam custom tidak ditemukan.",
            });
          }
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Jam Custom dengan waktu ${input.jamMulai} - ${input.jamSelesai} sudah ada.`,
            });
          }
        }
        throw error;
      }
    }),
});
