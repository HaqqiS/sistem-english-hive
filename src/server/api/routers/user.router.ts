import { Prisma, UserRole } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { registerGuruFormSchema } from "@/types/user.type";
import z from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getAllGuruSimple: protectedProcedure.query(async ({ ctx }) => {
    const gurus = await ctx.db.user.findMany({
      where: { role: UserRole.GURU },
      select: {
        id: true,
        name: true,
      },
    });

    return gurus;
  }),

  getAllGuruComplete: protectedProcedure.query(async ({ ctx }) => {
    const gurus = await ctx.db.user.findMany({
      where: { role: UserRole.GURU },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return gurus;
  }),

  createGuru: protectedProcedure
    .input(registerGuruFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      try {
        const hashPassword = await bcrypt.hash(input.password, 12);

        const newGuru = await db.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: hashPassword,
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
      const { db } = ctx;

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
      const { db } = ctx;
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
      const { db } = ctx;
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
      const { db } = ctx;

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
