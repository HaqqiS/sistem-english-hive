import { getAbsensiByJadwalSesiIdSchema } from "@/types/absenMurid.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { StatusAbsenMurid, StatusPembayaran } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { calculateSisaPertemuan } from "@/server/services/pembayaran.service";
import dayjs from "@/utils/dateUtils";

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

  getMuridForAbsensi: protectedProcedure
    .input(z.object({ sesiId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { sesiId } = input;

      // 1. Dapatkan info sesi & kelasId
      const sesi = await db.sesiPertemuanKelas.findUnique({
        where: { id: sesiId },
        select: {
          kelasId: true,
          tanggalWaktu: true,
          kelas: { select: { kodeKelas: true } },
        },
      });

      if (!sesi) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sesi tidak ditemukan",
        });
      }

      // 2. Dapatkan semua murid yang terdaftar & aktif di kelas ini
      const pendaftar = await db.pendaftaranKelas.findMany({
        where: {
          kelasId: sesi.kelasId,
          isAktif: true,
        },
        select: {
          id: true,
          murid: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
        },
        orderBy: {
          murid: { namaLengkap: "asc" },
        },
      });

      // 3. Dapatkan data absensi yang SUDAH ADA untuk sesi ini
      const existingAbsensi = await db.absensiMurid.findMany({
        where: {
          sesiPertemuanKelasId: sesiId,
        },
        select: {
          id: true,
          muridId: true,
          status: true,
        },
      });

      // 4. Buat Map untuk lookup absensi
      const absensiMap = new Map(
        existingAbsensi.map((a) => [a.muridId, { id: a.id, status: a.status }]),
      );

      // 5. Gabungkan data
      const muridList = pendaftar.map((p) => {
        const absensi = absensiMap.get(p.murid.id);
        return {
          muridId: p.murid.id,
          pendaftaranId: p.id, // Kirim ID pendaftaran ke FE jika perlu, atau pakai di backend
          namaLengkap: p.murid.namaLengkap,
          absensiId: absensi?.id ?? null,
          status: absensi?.status ?? null,
        };
      });

      return {
        sesiInfo: {
          kodeKelas: sesi.kelas.kodeKelas,
          tanggalWaktu: sesi.tanggalWaktu,
        },
        muridList: muridList,
      };
    }),

  createOrUpdateAbsensi: protectedProcedure
    .input(
      z.object({
        sesiId: z.string(),
        muridId: z.string(),
        status: z.nativeEnum(StatusAbsenMurid),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { sesiId, muridId, status } = input;

      // 1. Lakukan Update Absensi Terlebih Dahulu
      const absensi = await db.absensiMurid.upsert({
        where: {
          muridId_sesiPertemuanKelasId: {
            muridId: muridId,
            sesiPertemuanKelasId: sesiId,
          },
        },
        update: {
          status: status,
        },
        create: {
          muridId: muridId,
          sesiPertemuanKelasId: sesiId,
          status: status,
        },
      });

      // 2. Logic Kalkulasi Tagihan (On-the-Fly)
      // Kita perlu mencari ID Pendaftaran Kelas yang aktif untuk murid & kelas ini
      // Ambil kelasId dari sesi dulu
      const sesi = await db.sesiPertemuanKelas.findUnique({
        where: { id: sesiId },
        select: { kelasId: true, tanggalWaktu: true },
      });

      if (sesi) {
        const pendaftaran = await db.pendaftaranKelas.findFirst({
          where: {
            muridId: muridId,
            kelasId: sesi.kelasId,
            isAktif: true,
          },
        });

        if (pendaftaran) {
          // Panggil Service Helper
          const billingStatus = await calculateSisaPertemuan(
            db,
            pendaftaran.id,
          );

          // Jika perlu buat tagihan baru
          if (billingStatus.needNewBill) {
            // -- PERBAIKAN: Pastikan nilainya number --
            const harga = billingStatus.hargaPerSesi ?? 0;
            const paket = billingStatus.paketPertemuan ?? 8;

            const totalTagihan = harga * paket;

            // Jatuh tempo = Hari ini (saat kuota habis) atau besok
            const jatuhTempo = dayjs().add(1, "day").toDate();

            await db.pembayaran.create({
              data: {
                pendaftaranKelasId: pendaftaran.id,
                pembayaranKe: billingStatus.nextBillPembayaranKe,
                jumlahBayar: totalTagihan,
                tanggalJatuhTempo: jatuhTempo,
                statusBayar: StatusPembayaran.BELUM_LUNAS,
                note: `Auto-Generate: Kuota sisa ${billingStatus.sisaPertemuan}. Paket ${paket} Sesi berikutnya.`,
              },
            });

            console.log(`Tagihan baru dibuat untuk ${billingStatus.muridName}`);
          }
        }
      }

      return absensi;
    }),
});
