import { serverKelasSchema, upLevelKelasSchema } from "@/types/kelas.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { JUMLAH_PERTEMUAN_PER_BLOK } from "@/constants/pembayaran";
import dayjs from "@/utils/dateUtils";
import { StatusPembayaran } from "@prisma/client";

export const kelasRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const kelas = await ctx.db.kelas.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        jenisKelas: true,
        level: true,
        grup: true,
        tipe: true,
        kodeKelas: true,
        bulanTahunAjar: true,
        deskripsi: true,
        hargaKelas: true,
        historyGuruKelases: {
          where: {
            selesaiPada: null,
          },
          select: {
            id: true,
            kelasId: true,
            guruId: true,
            statusGuru: true,
            mulaiPada: true,
            selesaiPada: true,
            guru: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    return kelas;
  }),

  getKelasById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const kelas = await ctx.db.kelas.findUnique({
        where: { id: input.id },
      });
      return kelas;
    }),

  /**
   * Query ini dirancang untuk halaman absensi guru.
   * Mengambil semua kelas, dan untuk setiap kelas, mengambil daftar sesi pertemuannya.
   *
   * @todo (Nanti) Tambahkan filter 'where' untuk hanya mengambil kelas
   * yang diajar oleh guru yang sedang login (ctx.session.user.id).
   */
  getKelasWithSesiForGuru: protectedProcedure.query(async ({ ctx }) => {
    const { db /*, session*/ } = ctx;
    // const guruId = session.user.id; // <-- Buka komentar ini saat siap implementasi filter

    const kelasWithSesi = await db.kelas.findMany({
      // where: {
      //   // Filter kelas yang diajar oleh guru yang login & masih aktif
      //   historyGuruKelases: {
      //     some: {
      //       guruId: guruId,
      //       statusGuru: "ACTIVE",
      //     },
      //   },
      // },
      orderBy: {
        kodeKelas: "asc", // Urutkan daftar kelas berdasarkan nama
      },
      select: {
        id: true,
        kodeKelas: true,
        // Ambil semua sesi pertemuan yang terkait dengan kelas ini
        sesiPertemuanKelases: {
          orderBy: {
            tanggalWaktu: "desc", // Tampilkan sesi terbaru di paling atas
          },
          select: {
            id: true,
            tanggalWaktu: true,
          },
        },
      },
    });

    // Filter kelas yang tidak memiliki sesi pertemuan
    return kelasWithSesi.filter(
      (kelas) => kelas.sesiPertemuanKelases.length > 0,
    );
  }),

  createKelas: protectedProcedure
    .input(serverKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const kelas = await db.kelas.create({
        data: {
          jenisKelas: input.jenisKelas,
          level: input.level,
          grup: input.grup,
          tipe: input.tipe,
          kodeKelas: input.kodeKelas,
          bulanTahunAjar: input.bulanTahunAjar,
          deskripsi: input.deskripsi,
          hargaKelas: input.hargaKelas,
        },
      });
      return kelas;
    }),

  updateKelas: protectedProcedure
    .input(serverKelasSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const kelas = await db.kelas.update({
        where: { id: input.id },
        data: {
          jenisKelas: input.jenisKelas,
          level: input.level,
          grup: input.grup,
          tipe: input.tipe,
          kodeKelas: input.kodeKelas,
          bulanTahunAjar: input.bulanTahunAjar,
          deskripsi: input.deskripsi,
          hargaKelas: input.hargaKelas,
        },
      });
      return kelas;
    }),

  deleteKelas: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const kelas = await db.kelas.delete({
        where: { id: input.id },
      });
      return kelas;
    }),

  upLevelKelas: protectedProcedure
    .input(upLevelKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const {
        oldKelasId,
        newLevel,
        newBulanTahunAjar,
        newKodeKelas,
        newTanggalMulai,
      } = input;

      // 1. Ambil Data Kelas Lama
      const oldKelas = await db.kelas.findUnique({
        where: { id: oldKelasId },
      });

      if (!oldKelas) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kelas lama tidak ditemukan.",
        });
      }

      // 2. Ambil Siswa AKTIF di Kelas Lama
      const activeStudents = await db.pendaftaranKelas.findMany({
        where: {
          kelasId: oldKelasId,
          isAktif: true,
        },
      });

      if (activeStudents.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Tidak ada siswa aktif di kelas ini untuk dinaikkan.",
        });
      }

      // 3. Jalankan Transaksi
      return await db.$transaction(async (tx) => {
        // A. Buat Kelas Baru (Salin data lama, override level & bulan)
        const newKelas = await tx.kelas.create({
          data: {
            jenisKelas: oldKelas.jenisKelas,
            tipe: oldKelas.tipe,
            grup: oldKelas.grup,
            hargaKelas: oldKelas.hargaKelas, // Asumsi harga sama sesuai request
            deskripsi: oldKelas.deskripsi,
            // Override dengan input baru
            level: newLevel,
            bulanTahunAjar: newBulanTahunAjar,
            kodeKelas: newKodeKelas,
          },
        });

        // B. Non-aktifkan Pendaftaran di Kelas Lama
        await tx.pendaftaranKelas.updateMany({
          where: {
            kelasId: oldKelasId,
            isAktif: true,
          },
          data: {
            isAktif: false,
          },
        });

        // C. Buat Pendaftaran Baru & Tagihan Awal untuk setiap siswa
        const totalTagihan = newKelas.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;
        const jatuhTempo = dayjs(newTanggalMulai).toDate();

        // Kita harus loop karena createMany tidak mengembalikan ID yang dibutuhkan untuk relasi Pembayaran
        for (const student of activeStudents) {
          // C.1 Buat Pendaftaran Baru
          const newPendaftaran = await tx.pendaftaranKelas.create({
            data: {
              muridId: student.muridId,
              kelasId: newKelas.id,
              tanggalMulai: newTanggalMulai,
              isAktif: true,
            },
          });

          // C.2 Buat Tagihan Awal (8 Pertemuan)
          await tx.pembayaran.create({
            data: {
              pendaftaranKelasId: newPendaftaran.id,
              pembayaranKe: 1,
              jumlahBayar: totalTagihan,
              tanggalJatuhTempo: jatuhTempo,
              statusBayar: StatusPembayaran.BELUM_LUNAS,
              note: `Tagihan Kenaikan Kelas (${JUMLAH_PERTEMUAN_PER_BLOK} Pertemuan)`,
            },
          });
        }

        return {
          newKelasId: newKelas.id,
          movedStudentCount: activeStudents.length,
        };
      });
    }),
});
