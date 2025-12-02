import { UserRole } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { registerGuruFormSchema } from "@/types/user.type";
import z from "zod";
import bcrypt from "bcryptjs";

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

      const hashPassword = await bcrypt.hash(input.password, 12);

      const newGuru = await db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashPassword,
        },
      });

      return newGuru;
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
      const updatedGuru = await db.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
        },
      });
      return updatedGuru;
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
      const result = await db.user.delete({
        where: { id: input.id },
      });
      return result;
    }),
});
