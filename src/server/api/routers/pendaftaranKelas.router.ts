import {
  serverBulkPendaftaranKelasSchema,
  serverPendaftaranKelasSchema,
  serverUpdatePendaftaranKelasSchema,
} from "@/types/pendaftaranKelas.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import dayjs from "dayjs";
import { TRPCError } from "@trpc/server";
import { StatusMurid, StatusPembayaran } from "@prisma/client";
import z from "zod";
import { JUMLAH_PERTEMUAN_PER_BLOK } from "@/constants/pembayaran";

export const pendaftaranKelasRouter = createTRPCRouter({
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

      const existingActiveRegistration = await db.pendaftaranKelas.findFirst({
        where: {
          muridId: input.muridId,
          isAktif: true, // Cek apakah ada pendaftaran LAIN yang masih aktif
        },
      });

      if (existingActiveRegistration) {
        // Gunakan TRPCError dan pesan yang benar
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Murid ini sudah terdaftar di kelas lain yang masih aktif. Nonaktifkan pendaftaran lama terlebih dahulu.",
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

        const jumlahSesiBerlalu = await tx.sesiPertemuanKelas.count({
          where: {
            kelasId: input.kelasId,
            // Hanya hitung sesi yang tanggalnya KURANG DARI tanggal mulai murid
            // Asumsi: input.tanggalMulai adalah string YYYY-MM-DD
            // TODO: ubah per pertemuanKelas
            tanggalWaktu: {
              lt: dayjs(input.tanggalMulai).startOf("day").toDate(),
            },
          },
        });

        const sesiTerpakaiDiBlokIni =
          jumlahSesiBerlalu % JUMLAH_PERTEMUAN_PER_BLOK;
        const sisaSesiYangHarusDibayar =
          JUMLAH_PERTEMUAN_PER_BLOK - sesiTerpakaiDiBlokIni;

        const totalTagihan = sisaSesiYangHarusDibayar * kelas.hargaKelas;
        const tanggalMulai = dayjs(input.tanggalMulai);

        const pembayaranKe =
          Math.floor(jumlahSesiBerlalu / JUMLAH_PERTEMUAN_PER_BLOK) + 1;

        const note =
          sisaSesiYangHarusDibayar < JUMLAH_PERTEMUAN_PER_BLOK
            ? `Pro-rate: Masuk telat ${sesiTerpakaiDiBlokIni} sesi. Tagihan untuk sisa ${sisaSesiYangHarusDibayar} pertemuan.`
            : `Tagihan Awal Penuh (${JUMLAH_PERTEMUAN_PER_BLOK} Pertemuan)`;

        // Buat HANYA 1 data pembayaran (Pembayaran Ke-1)
        // Pembayaran ke-2 dst akan digenerate otomatis saat absen mencapai 8, 16, dst.
        await tx.pembayaran.create({
          data: {
            pendaftaranKelasId: pendaftaran.id,
            pembayaranKe: pembayaranKe,
            jumlahBayar: totalTagihan,
            tanggalJatuhTempo: tanggalMulai.toDate(),
            statusBayar: StatusPembayaran.BELUM_LUNAS,
            note: note,
          },
        });

        return pendaftaran;
      });

      return newPendaftaranKelas;
    }),

  createBulkPendaftaranKelas: protectedProcedure
    .input(serverBulkPendaftaranKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { muridIds, kelasId, tanggalMulai } = input;

      // 1. Ambil info harga kelas
      const kelas = await db.kelas.findUnique({
        where: { id: kelasId },
        select: { hargaKelas: true, kodeKelas: true },
      });

      if (!kelas) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kelas yang dipilih tidak ditemukan.",
        });
      }

      // 2. Validasi: Cek apakah ada murid yang sudah terdaftar aktif di kelas manapun
      // Kita cek satu per satu atau pakai `in` query
      const existingActive = await db.pendaftaranKelas.findMany({
        where: {
          muridId: { in: muridIds },
          isAktif: true,
        },
        include: { murid: true },
      });

      if (existingActive.length > 0) {
        const names = existingActive.map((p) => p.murid.namaLengkap).join(", ");
        throw new TRPCError({
          code: "CONFLICT",
          message: `Beberapa murid sudah terdaftar aktif: ${names}. Harap nonaktifkan dulu atau hapus dari seleksi.`,
        });
      }

      // 3. Transaction: Loop create pendaftaran & invoice
      await db.$transaction(async (tx) => {
        const tglMulaiDate = dayjs(tanggalMulai).toDate();

        const jumlahSesiBerlalu = await tx.sesiPertemuanKelas.count({
          where: {
            kelasId: kelasId,
            tanggalWaktu: {
              lt: dayjs(tanggalMulai).startOf("day").toDate(),
            },
          },
        });

        const sesiTerpakaiDiBlokIni =
          jumlahSesiBerlalu % JUMLAH_PERTEMUAN_PER_BLOK;
        const sisaSesiYangHarusDibayar =
          JUMLAH_PERTEMUAN_PER_BLOK - sesiTerpakaiDiBlokIni;
        const totalTagihan = sisaSesiYangHarusDibayar * kelas.hargaKelas;

        const pembayaranKe =
          Math.floor(jumlahSesiBerlalu / JUMLAH_PERTEMUAN_PER_BLOK) + 1;
        const note =
          sisaSesiYangHarusDibayar < JUMLAH_PERTEMUAN_PER_BLOK
            ? `Pro-rate Bulk: Sisa ${sisaSesiYangHarusDibayar} pertemuan.`
            : `Tagihan Awal (${JUMLAH_PERTEMUAN_PER_BLOK} Pertemuan)`;

        for (const muridId of muridIds) {
          const pendaftaran = await tx.pendaftaranKelas.create({
            data: {
              muridId: muridId,
              kelasId: kelasId,
              tanggalMulai: tanggalMulai,
              isAktif: true,
            },
          });

          // 3b. Buat Tagihan Awal
          await tx.pembayaran.create({
            data: {
              pendaftaranKelasId: pendaftaran.id,
              pembayaranKe: pembayaranKe,
              jumlahBayar: totalTagihan,
              tanggalJatuhTempo: tglMulaiDate,
              statusBayar: StatusPembayaran.BELUM_LUNAS,
              note: note,
            },
          });
        }
      });

      return { success: true, count: muridIds.length };
    }),

  updatePendaftaranKelas: protectedProcedure
    .input(serverUpdatePendaftaranKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      // 1. Ambil data pendaftaran lama
      const existingRecord = await db.pendaftaranKelas.findUnique({
        where: { id: input.id },
      });

      if (!existingRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data pendaftaran tidak ditemukan",
        });
      }

      // 2. Cek apakah ada perubahan fundamental (Siswa atau Kelas)
      const isMuridChanged = existingRecord.muridId !== input.muridId;
      const isKelasChanged = existingRecord.kelasId !== input.kelasId;

      // === SKENARIO: GANTI SISWA ATAU PINDAH KELAS (Buat Baru) ===
      if (isMuridChanged || isKelasChanged) {
        // Ambil info harga dari kelas TUJUAN (baik itu kelas baru atau tetap kelas lama)
        const targetKelas = await db.kelas.findUnique({
          where: { id: input.kelasId },
          select: { hargaKelas: true },
        });

        if (!targetKelas) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kelas tujuan tidak ditemukan",
          });
        }

        return await db.$transaction(async (tx) => {
          // A. Non-aktifkan pendaftaran lama (Soft Delete / Arsip)
          await tx.pendaftaranKelas.update({
            where: { id: input.id },
            data: { isAktif: false },
          });

          // B. Buat Pendaftaran Baru
          const newRegistration = await tx.pendaftaranKelas.create({
            data: {
              muridId: input.muridId, // Pakai muridId dari input (baru/lama)
              kelasId: input.kelasId, // Pakai kelasId dari input (baru/lama)
              tanggalMulai: input.tanggalMulai,
              isAktif: true,
            },
          });

          // C. Generate Tagihan Pertama untuk Pendaftaran Baru
          // Menggunakan harga kelas tujuan * 8 pertemuan
          const totalTagihan =
            targetKelas.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;

          // Buat catatan otomatis agar admin tahu kenapa tagihan ini muncul
          let noteType = "Transfer Kelas";
          if (isMuridChanged && isKelasChanged)
            noteType = "Ganti Siswa & Kelas";
          else if (isMuridChanged) noteType = "Ganti Siswa";

          await tx.pembayaran.create({
            data: {
              pendaftaranKelasId: newRegistration.id,
              pembayaranKe: 1,
              jumlahBayar: totalTagihan,
              tanggalJatuhTempo: dayjs(input.tanggalMulai).toDate(),
              statusBayar: StatusPembayaran.BELUM_LUNAS,
              note: `Tagihan ${noteType} (${JUMLAH_PERTEMUAN_PER_BLOK} Pertemuan)`,
            },
          });

          return newRegistration;
        });
      }

      // === SKENARIO: UPDATE BIASA (Edit Data Ringan) ===
      else {
        const updated = await db.pendaftaranKelas.update({
          where: { id: input.id },
          data: {
            // Karena muridId dan kelasId sama, tidak perlu diupdate
            tanggalMulai: input.tanggalMulai,
            isAktif: input.isAktif, // Admin bisa manual matikan status di sini
          },
        });

        return updated;
      }
    }),

  deletePendaftaranKelas: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const exists = await db.pendaftaranKelas.findUnique({
        where: { id: input.id },
      });

      if (!exists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data pendaftaran tidak ditemukan",
        });
      }

      const existingMuridKelas = await db.pendaftaranKelas.findFirst({
        where: { id: input.id },
        select: { muridId: true },
      });
      if (existingMuridKelas) {
        await db.$transaction(async (tx) => {
          // update status murid yang terkait menjadi 'NON-AKTIF'
          await tx.murid.update({
            where: { id: existingMuridKelas.muridId },
            data: { statusMurid: StatusMurid.NON_AKTIF },
          });
        });
      }

      return db.pendaftaranKelas.delete({
        where: { id: input.id },
      });
    }),
});
