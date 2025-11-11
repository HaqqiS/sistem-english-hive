import { createTRPCRouter, protectedProcedure } from "../trpc";
import dayjs from "dayjs";

export const pembayaranRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    return db.pembayaran.findMany();
  }),
  getTagihanJatuhTempo: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const HARI_INI = dayjs().startOf("day");
    const TUJUH_HARI_LAGI = dayjs().add(10, "day").endOf("day");

    return db.pembayaran.findMany({
      where: {
        statusBayar: "BELUM_LUNAS",
        tanggalJatuhTempo: {
          gte: HARI_INI.toDate(),
          lte: TUJUH_HARI_LAGI.toDate(),
        },
      },
      include: {
        pendaftaranKelas: {
          include: {
            murid: { select: { namaLengkap: true, noWA: true } },
            Kelas: { select: { kodeKelas: true } },
          },
        },
      },
    });
  }),
});
