import { Prisma, UserRole } from "@prisma/client";
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
import { paginationSchema } from "@/types/pagination.type";
import {
  handleAutoLevelUp,
  handleClassCompletion,
} from "@/server/services/kelas.service";

export const absenGuruRouter = createTRPCRouter({
  getAllAbsensi: protectedProcedure
    .input(
      paginationSchema.extend({
        search: z.string().optional(),
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM")
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { pageIndex, pageSize, month, search } = input;

      const whereClause: Prisma.AbsensiGuruWhereInput = {};

      if (search) {
        whereClause.guru = {
          name: { contains: search, mode: "insensitive" },
        };
      }
      if (month && month !== "") {
        const { startDate, endDate } = getPeriodeGaji(month);

        whereClause.sesiPertemuanKelas = {
          tanggalWaktu: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      const [total, data] = await db.$transaction([
        db.absensiGuru.count({ where: whereClause }),
        db.absensiGuru.findMany({
          skip: pageIndex * pageSize,
          take: pageSize,
          where: whereClause,
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
        }),
      ]);

      const pageCount = Math.ceil(total / pageSize);
      return {
        data,
        pageCount,
        total,
      };
    }),

  getForExport: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM")
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { month, search } = input;

      const whereClause: Prisma.AbsensiGuruWhereInput = {};
      if (search) {
        whereClause.guru = {
          name: { contains: search, mode: "insensitive" },
        };
      }
      if (month && month !== "") {
        const { startDate, endDate } = getPeriodeGaji(month);

        whereClause.sesiPertemuanKelas = {
          tanggalWaktu: {
            gte: startDate,
            lte: endDate,
          },
        };
      }

      // Ambil SEMUA data (Tanpa Pagination)
      return await db.absensiGuru.findMany({
        where: whereClause,
        orderBy: { sesiPertemuanKelas: { tanggalWaktu: "desc" } },
        select: {
          guru: { select: { name: true } },
          status: true,
          isVerified: true,
          sesiPertemuanKelas: {
            select: {
              tanggalWaktu: true,
              kelas: { select: { kodeKelas: true } },
              ruang: { select: { namaRuang: true } },
            },
          },
        },
      });
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

      try {
        // 1. Dapatkan data jadwal & kelas
        const jadwal = await db.jadwalKelas.findUnique({
          where: { id: jadwalKelasId },
          select: {
            kelasId: true,
            ruangId: true,
            kelas: {
              select: {
                level: true,
                cohortId: true,
                jenisKelas: true,
                tipe: true,
                grup: true,
                hargaKelas: true,
                deskripsi: true,
                kodeKelas: true,
                cabangId: true,
              },
            },
          },
        });

        if (!jadwal)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Jadwal tidak ditemukan",
          });

        // 2. Tentukan ruangId yang akan dipakai
        // Prioritaskan override, jika tidak ada, pakai ruang dari jadwal
        const finalRuangId = overrideRuangId ?? jadwal.ruangId;
        // 3. Tentukan tanggalWaktu (REALITA)
        // Gunakan Waktu WITA saat ini
        const tanggalWaktuSesi = dayjs().tz(TIMEZONE_BISNIS).toDate();

        // 4. Transaction: Buat Sesi -> Cek Level Up -> Cek Finish
        const result = await db.$transaction(async (tx) => {
          // 4a. Buat SesiPertemuanKelas (Realisasi)
          const newSesi = await tx.sesiPertemuanKelas.create({
            data: {
              kelasId: jadwal.kelasId,
              ruangId: finalRuangId,
              tanggalWaktu: tanggalWaktuSesi,
              jadwalKelasId: jadwalKelasId,
            },
            select: { id: true },
          });

          // 4b. Buat AbsensiGuru
          await tx.absensiGuru.create({
            data: {
              guruId,
              sesiPertemuanKelasId: newSesi.id,
              status,
              isVerified: false,
            },
          });

          // Hitung Total Sesi (Termasuk yang baru dibuat)
          const totalSesi = await tx.sesiPertemuanKelas.count({
            where: { kelasId: jadwal.kelasId },
          });

          // === SERVICE CALL: LEVEL UP (Trigger di Sesi 20) ===
          if (totalSesi === 20) {
            await handleAutoLevelUp({ tx, jadwal });
          }

          // === SERVICE CALL: CLASS COMPLETION (Trigger di Sesi 24) ===
          const isFinished = await handleClassCompletion(
            tx,
            jadwal.kelasId,
            totalSesi,
          );

          return {
            newSesiId: newSesi.id,
            absensiId: null,
            isFinished: isFinished,
          };
        });

        return result;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2003: Referensi Ruang/Kelas tidak valid saat create
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Ruang atau Kelas tidak valid saat membuat sesi.",
            });
          }
        }
        throw error;
      }
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

      if ((session.user.role as UserRole) !== UserRole.ADMIN)
        throw new Error("Unauthorized");
      try {
        await db.absensiGuru.update({
          where: {
            id: input.absensiId,
          },
          data: {
            verifiedById: session.user.id,
            isVerified: input.isVerified,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Absensi tidak ditemukan.",
            });
          }
        }
        throw error;
      }
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

      try {
        // 2. Ambil data lama untuk pengecekan
        // const oldAbsensi = await db.absensiGuru.findUnique({
        //   where: { id: absensiId },
        //   select: { guruId: true, sesiPertemuanKelasId: true },
        // });

        // if (!oldAbsensi)
        //   throw new TRPCError({
        //     code: "NOT_FOUND",
        //     message: "Data tidak ditemukan",
        //   });

        // // 3. --- PERBAIKAN: Cek Duplikat jika Guru Diganti ---
        // if (guruId && guruId !== oldAbsensi.guruId) {
        //   const exists = await db.absensiGuru.findUnique({
        //     where: {
        //       guruId_sesiPertemuanKelasId: {
        //         guruId: guruId,
        //         sesiPertemuanKelasId: oldAbsensi.sesiPertemuanKelasId,
        //       },
        //     },
        //   });

        //   if (exists) {
        //     throw new TRPCError({
        //       code: "CONFLICT",
        //       message: "Guru yang dipilih sudah memiliki absensi di sesi ini.",
        //     });
        //   }
        // }

        const updatedAbsensi = await db.absensiGuru.update({
          where: { id: absensiId },
          data: {
            status: status,
            isVerified: isVerified,
            guruId: guruId,
            verifiedById: isVerified ? session.user.id : null,
          },
        });

        return updatedAbsensi;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Absensi tidak ditemukan.",
            });
          }
          // P2002: Jika guru diganti, cek apakah guru baru sudah absen di sesi yang sama?
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Guru yang dipilih sudah memiliki absensi di sesi ini.",
            });
          }
          // P2003: Guru ID baru tidak valid
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Guru pengganti tidak valid.",
            });
          }
        }
        throw error;
      }
    }),

  deleteAbsenGuru: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { id } = input;

      try {
        await db.absensiGuru.delete({
          where: { id },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Absensi tidak ditemukan atau sudah dihapus.",
            });
          }
        }
        throw error;
      }
    }),
});
