import { UserRole } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getAllGuru: protectedProcedure.query(async ({ ctx }) => {
    const gurus = await ctx.db.user.findMany({
      where: { role: UserRole.GURU },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(gurus);
    return gurus;
  }),
});
