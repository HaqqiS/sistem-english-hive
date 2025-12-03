import { serverJamSchema } from "@/types/jam.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const jamRouter = createTRPCRouter({
  // Jam Tetap
  getAllJamTetap: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const jams = await db.jamSlotTetap.findMany({
      select: {
        id: true,
        cabangId: true,
        namaSlot: true,
        jamMulai: true,
        jamSelesai: true,
        cabang: {
          select: {
            namaCabang: true,
          },
        },
      },
    });
    return jams;
  }),

  createJamTetap: protectedProcedure
    .input(serverJamSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      try {
        const newJam = await db.jamSlotTetap.create({
          data: {
            cabangId: input.cabangId,
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
      const { db } = ctx;

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
      const { db } = ctx;

      try {
        const updatedJam = await db.jamSlotTetap.update({
          where: { id: input.id },
          data: {
            cabangId: input.cabangId,
            namaSlot: input.namaSlot,
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

    const jams = await db.jamSlotCustom.findMany({
      select: {
        id: true,
        jamMulai: true,
        jamSelesai: true,
      },
    });
    return jams;
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
          // Catatan: JamSlotCustom di schema Anda memiliki onDelete: Cascade di JadwalKelas.
          // Jadi penghapusan ini AMAN (tapi akan menghapus Jadwal terkait secara otomatis).
          // Tidak perlu handle P2003 kecuali Anda mengubah schema menjadi Restrict.
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
