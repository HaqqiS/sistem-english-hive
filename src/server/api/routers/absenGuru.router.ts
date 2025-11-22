import { UserRole } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  serverStartSesiSchema,
  updateAbsensiGuruSchema,
} from "@/types/absenGuru.type";
import dayjs from "dayjs";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { TIMEZONE_BISNIS } from "@/utils/dateUtils";
import { getPeriodeGaji } from "@/server/services/gaji.service";

export const absenGuruRouter = createTRPCRouter({
  getAllAbsensi: protectedProcedure.query(async ({ ctx }) => {
    // ... (kode getAllAbsensi Anda yang sudah ada)
    const { db } = ctx;
    const result = await db.absensiGuru.findMany({
      orderBy: {
        updatedAt: "desc",
      },
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
        /** Input bulan pembayaran (Gaji Bulan X) dalam format "YYYY-MM" */
        month: z.string().regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { guruId, month } = input;

      // 1. Gunakan Service untuk mendapatkan range tanggal (26 prev - 25 curr)
      const { startDate, endDate } = getPeriodeGaji(month);

      // 2. Query absensi guru berdasarkan range tanggal tersebut
      const history = await db.absensiGuru.findMany({
        where: {
          guruId: guruId,
          isVerified: true,
          sesiPertemuanKelas: {
            tanggalWaktu: {
              gte: startDate,
              lte: endDate,
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
            tanggalWaktu: "asc",
          },
        },
      });

      return history;
    }),

  updateAbsenGuru: protectedProcedure
    .input(
      updateAbsensiGuruSchema.extend({
        absensiId: z.string().cuid("ID absensi tidak valid"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { status, isVerified, guruId, absensiId } = input;

      if (isVerified && (session.user.role as UserRole) !== UserRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Hanya admin yang dapat memverifikasi absensi.",
        });
      }

      // 2. Ambil data lama untuk pengecekan
      const oldAbsensi = await db.absensiGuru.findUnique({
        where: { id: absensiId },
        select: { guruId: true, sesiPertemuanKelasId: true },
      });

      if (!oldAbsensi)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data tidak ditemukan",
        });

      // 3. --- PERBAIKAN: Cek Duplikat jika Guru Diganti ---
      if (guruId && guruId !== oldAbsensi.guruId) {
        const exists = await db.absensiGuru.findUnique({
          where: {
            guruId_sesiPertemuanKelasId: {
              guruId: guruId,
              sesiPertemuanKelasId: oldAbsensi.sesiPertemuanKelasId,
            },
          },
        });

        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Guru yang dipilih sudah memiliki absensi di sesi ini.",
          });
        }
      }

      const updatedAbsensi = await db.absensiGuru.update({
        where: { id: input.absensiId },
        data: {
          status: status,
          isVerified: isVerified,
          guruId: guruId,
          verifiedById: isVerified ? session.user.id : null,
        },
      });

      return updatedAbsensi;
    }),

  deleteAbsenGuru: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { id } = input;

      await db.absensiGuru.delete({
        where: { id },
      });
    }),
});
