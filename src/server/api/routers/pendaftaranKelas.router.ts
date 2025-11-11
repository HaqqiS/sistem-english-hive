import { serverPendaftaranKelasSchema } from "@/types/pendaftaranKelas.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import dayjs from "dayjs";
import { TRPCError } from "@trpc/server";
import { StatusPembayaran } from "@prisma/client";

export const pendaftaranKelasRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const pendaftaranKelas = await ctx.db.pendaftaranKelas.findMany({
      include: {
        murid: {
          select: {
            namaLengkap: true,
            email: true,
          },
        },
        Kelas: {
          select: {
            kodeKelas: true,
          },
        },
      },
    });

    return pendaftaranKelas;
  }),

  getPendaftarByKelasId: protectedProcedure
    .input(serverPendaftaranKelasSchema.pick({ kelasId: true }))
    .query(async ({ ctx, input }) => {
      const pendaftaranKelas = await ctx.db.pendaftaranKelas.findMany({
        where: {
          kelasId: input.kelasId,
        },
        include: {
          murid: {
            select: {
              namaLengkap: true,
              email: true,
            },
          },
          Kelas: {
            select: {
              kodeKelas: true,
            },
          },
        },
      });

      return pendaftaranKelas;
    }),

  createPendaftaranKelas: protectedProcedure
    .input(serverPendaftaranKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      // 1. Kita butuh harga kelas untuk tagihan
      const kelas = await db.kelas.findUnique({
        where: { id: input.kelasId },
        select: { hargaKelas: true },
      });

      if (!kelas) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kelas yang dipilih tidak ditemukan.",
        });
      }

      // 2. Gunakan $transaction
      const newPendaftaranKelas = await db.$transaction(async (tx) => {
        // 2a. Buat Pendaftaran
        const pendaftaran = await tx.pendaftaranKelas.create({
          data: {
            ...input,
            isAktif: true,
          },
        });

        // 2b. Siapkan data untuk 3 tagihan pembayaran
        const tanggalMulai = dayjs(input.tanggalMulai);
        const dataPembayaran = [
          {
            pendaftaranKelasId: pendaftaran.id,
            pembayaranKe: 1,
            jumlahBayar: kelas.hargaKelas,
            tanggalJatuhTempo: tanggalMulai.toDate(), // Bulan pertama
            statusBayar: StatusPembayaran.BELUM_LUNAS,
          },
          {
            pendaftaranKelasId: pendaftaran.id,
            pembayaranKe: 2,
            jumlahBayar: kelas.hargaKelas,
            tanggalJatuhTempo: tanggalMulai.add(1, "month").toDate(), // Bulan kedua
            statusBayar: StatusPembayaran.BELUM_LUNAS,
          },
          {
            pendaftaranKelasId: pendaftaran.id,
            pembayaranKe: 3,
            jumlahBayar: kelas.hargaKelas,
            tanggalJatuhTempo: tanggalMulai.add(2, "month").toDate(), // Bulan ketiga
            statusBayar: StatusPembayaran.BELUM_LUNAS,
          },
        ];

        // 2c. Buat 3 data pembayaran sekaligus
        await tx.pembayaran.createMany({
          data: dataPembayaran,
        });

        return pendaftaran;
      });

      return newPendaftaranKelas;
    }),
});
