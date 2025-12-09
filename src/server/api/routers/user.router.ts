import { Prisma, UserRole } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { registerGuruFormSchema } from "@/types/user.type";
import z from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { getRestrictedCabangId } from "@/server/utils/permission";

export const userRouter = createTRPCRouter({
  getAllGuruSimple: protectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // 1. Security Filter
      const filterCabangId = getRestrictedCabangId(session, input?.cabangId);

      const whereClause: Prisma.UserWhereInput = {
        role: UserRole.GURU,
      };

      if (filterCabangId) {
        whereClause.cabangId = filterCabangId;
        // OPSI: Jika ingin menampilkan Guru Floating (cabangId null)
        // whereClause.OR = [
        //   { cabangId: filterCabangId },
        //   { cabangId: null }
        // ];
      }

      const gurus = await db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
        },
      });

      return gurus;
    }),

  getAllGuruComplete: protectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // 1. Security Filter
      const filterCabangId = getRestrictedCabangId(session, input?.cabangId);

      const whereClause: Prisma.UserWhereInput = {
        role: UserRole.GURU,
      };

      if (filterCabangId) {
        whereClause.cabangId = filterCabangId;
      }
      const gurus = await db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          cabang: { select: { namaCabang: true } },
        },
      });

      return gurus;
    }),

  createGuru: protectedProcedure
    .input(registerGuruFormSchema.extend({ cabangId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const finalCabangId = getRestrictedCabangId(session, input.cabangId);

      if (!finalCabangId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cabang harus ditentukan untuk mendaftarkan Guru.",
        });
      }

      try {
        const hashPassword = await bcrypt.hash(input.password, 12);

        const newGuru = await db.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: hashPassword,
            cabangId: finalCabangId,
            role: UserRole.GURU,
          },
        });
        return newGuru;
      } catch (error) {
        // Tangani Duplikat Email
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email sudah terdaftar. Gunakan email lain.",
            });
          }
        }
        throw error;
      }
    }),

  updateGuru: protectedProcedure
    .input(
      registerGuruFormSchema
        .extend({
          id: z.string().cuid(),
        })
        .omit({ password: true }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // 1. Cek Kepemilikan (Ownership Check)
      const existingGuru = await db.user.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingGuru) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data guru tidak ditemukan",
        });
      }

      // 2. Validasi Akses Cabang
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && existingGuru.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mengedit data guru dari cabang lain.",
        });
      }

      try {
        const updatedGuru = await db.user.update({
          where: { id: input.id },
          data: {
            name: input.name,
            email: input.email,
          },
        });
        return updatedGuru;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2025: Record to update not found
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Data guru tidak ditemukan",
            });
          }
          // P2002: Email baru bentrok dengan user lain
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email baru ini sudah digunakan user lain",
            });
          }
        }
        throw error;
      }
    }),

  resetPasswordGuru: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // 1. Cek Kepemilikan
      const existingGuru = await db.user.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingGuru) throw new TRPCError({ code: "NOT_FOUND" });

      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && existingGuru.cabangId !== allowedCabangId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Akses ditolak." });
      }
      // Set password default to 'password123'
      const defaultPassword = "password123";
      const hashPassword = await bcrypt.hash(defaultPassword, 10);
      const updatedGuru = await db.user.update({
        where: { id: input.id },
        data: {
          password: hashPassword,
        },
      });
      return updatedGuru;
    }),

  changePasswordGuru: protectedProcedure
    .input(z.object({ id: z.string().cuid(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const existingUser = await db.user.findUnique({
        where: { id: input.id },
        select: { cabangId: true }
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User tidak ditemukan."
        });
      }

      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && existingUser.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mengubah password user dari cabang lain."
        });
      }

      const hashPassword = await bcrypt.hash(input.newPassword, 10);
      const updatedGuru = await db.user.update({
        where: { id: input.id },
        data: {
          password: hashPassword,
        },
      });
      return updatedGuru;
    }),

  deleteGuru: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // 1. Cek Kepemilikan
      const existingGuru = await db.user.findUnique({
        where: { id: input.id },
        select: { cabangId: true },
      });

      if (!existingGuru) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Guru sudah dihapus atau tidak ditemukan",
        });
      }

      // 2. Validasi Akses
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && existingGuru.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak menghapus guru dari cabang lain.",
        });
      }

      try {
        const result = await db.user.delete({
          where: { id: input.id },
        });
        return result;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Guru sudah dihapus atau tidak ditemukan",
            });
          }
          // P2003: Foreign Key constraint (Misal guru masih punya jadwal aktif)
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "Guru tidak bisa dihapus karena masih memiliki data terkait (Jadwal/Absensi). Non-aktifkan saja statusnya.",
            });
          }
        }
        throw error;
      }
    }),
});
