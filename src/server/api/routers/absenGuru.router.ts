import { UserRole } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  serverCreateSesiAbsensiGuruSchema,
  serverStartSesiSchema,
} from "@/types/absenGuru.type";
import dayjs from "dayjs";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { TIMEZONE_BISNIS } from "@/utils/dateUtils";

export const absenGuruRouter = createTRPCRouter({
  getAllAbsensi: protectedProcedure.query(async ({ ctx }) => {
    // ... (kode getAllAbsensi Anda yang sudah ada)
    const { db } = ctx;
    const result = await db.absensiGuru.findMany({
      select: {
        id: true,
        guruId: true,
        guru: {
          select: {
            name: true,
          },
        },
        sesiPertemuanKelasId: true,
        sesiPertemuanKelas: {
          select: {
            tanggalWaktu: true,
            kelas: {
              select: {
                kodeKelas: true,
              },
            },
            ruang: {
              // <-- Pastikan Anda juga menyertakan ruang di sini
              select: {
                namaRuang: true,
              },
            },
          },
        },
        status: true,
        isVerified: true,
        verifiedById: true,
        verifiedBy: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return result;
  }),

  /**
   * Dipanggil saat guru mengklik "Mulai Sesi".
   * Membuat SesiPertemuanKelas (realisasi) DAN AbsensiGuru (catatan hadir guru).
   * Mengembalikan ID SesiPertemuanKelas yang baru dibuat untuk redirect.
   */
  createSesiAndAbsensi: protectedProcedure
    .input(serverStartSesiSchema) // <-- Gunakan skema baru
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const guruId = session.user.id;
      const { jadwalKelasId, status, overrideRuangId } = input;

      // 1. Dapatkan data jadwal (rencana)
      const jadwal = await db.jadwalKelas.findUnique({
        where: { id: jadwalKelasId },
        select: { kelasId: true, ruangId: true }, // Ambil data default
      });

      if (!jadwal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Jadwal kelas tidak ditemukan.",
        });
      }

      // 2. Tentukan ruangId yang akan dipakai
      // Prioritaskan override, jika tidak ada, pakai ruang dari jadwal
      const finalRuangId = overrideRuangId ?? jadwal.ruangId;

      // 3. Tentukan tanggalWaktu (REALITA)
      // Gunakan Waktu WITA saat ini
      const tanggalWaktuSesi = dayjs().tz(TIMEZONE_BISNIS).toDate();

      // 4. Gunakan $transaction
      const result = await db.$transaction(async (tx) => {
        // 4a. Buat SesiPertemuanKelas (Realisasi)
        const newSesi = await tx.sesiPertemuanKelas.create({
          data: {
            kelasId: jadwal.kelasId,
            ruangId: finalRuangId, // <-- Gunakan ruangId final
            tanggalWaktu: tanggalWaktuSesi, // <-- Gunakan waktu server
            jadwalKelasId: jadwalKelasId, // <-- Link ke rencana
          },
          select: { id: true },
        });

        // 4b. Buat AbsensiGuru
        const newAbsensi = await tx.absensiGuru.create({
          data: {
            guruId: guruId,
            sesiPertemuanKelasId: newSesi.id,
            status: status,
            isVerified: false,
          },
        });

        // Kembalikan ID sesi yang baru dibuat
        return {
          newSesiId: newSesi.id,
          absensiId: newAbsensi.id,
        };
      });

      return result;
    }),

  verifyAbsensi: protectedProcedure
    .input(
      z.object({
        absensiId: z.string(),
        isVerified: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      if ((session.user.role as UserRole) !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
      }

      await db.absensiGuru.update({
        where: {
          id: input.absensiId,
        },
        data: {
          verifiedById: session.user.id,
          isVerified: input.isVerified,
        },
      });
    }),

  getHistoryByGuruId: protectedProcedure
    .input(
      z.object({
        guruId: z.string().cuid(),
        /** Input bulan dalam format "YYYY-MM" (contoh: "2025-11") */
        month: z.string().regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { guruId, month } = input;

      // 1. Tentukan rentang tanggal (satu bulan)
      const startDate = dayjs(month).startOf("month").toDate();
      const endDate = dayjs(month).endOf("month").toDate();

      // 2. Query absensi guru
      const history = await db.absensiGuru.findMany({
        where: {
          guruId: guruId,
          isVerified: true, // <-- PENTING: Hanya ambil yang sudah diverifikasi
          sesiPertemuanKelas: {
            tanggalWaktu: {
              gte: startDate, // >= 1 November 2025
              lte: endDate, // <= 30 November 2025
            },
          },
        },
        select: {
          id: true,
          status: true,
          isVerified: true,
          sesiPertemuanKelas: {
            select: {
              tanggalWaktu: true,
              kelas: {
                select: {
                  kodeKelas: true,
                },
              },
              ruang: {
                select: {
                  namaRuang: true,
                },
              },
            },
          },
        },
        orderBy: {
          sesiPertemuanKelas: {
            tanggalWaktu: "asc", // Urutkan dari awal bulan
          },
        },
      });

      return history;
    }),
});
