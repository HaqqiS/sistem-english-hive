import { getAbsensiByJadwalSesiIdSchema } from "@/types/absenMurid.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const absenMuridRouter = createTRPCRouter({
  getAbsensiByJadwalSesiId: protectedProcedure
    .input(getAbsensiByJadwalSesiIdSchema)
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { jadwalSesiId } = input;

      const result = await db.absensiMurid.findMany({
        where: {
          sesiPertemuanKelasId: jadwalSesiId,
        },
        select: {
          id: true,
          status: true,
          muridId: true,
          murid: {
            select: {
              namaLengkap: true,
            },
          },
        },
      });
      return result;
    }),
});
