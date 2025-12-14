import { serverKelasSchema, upLevelKelasSchema } from "@/types/kelas.type";
import { createTRPCRouter, cabangProtectedProcedure } from "../trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { JUMLAH_PERTEMUAN_PER_BLOK } from "@/constants/pembayaran";
import dayjs from "@/utils/dateUtils";
import {
  Prisma,
  StatusMurid,
  StatusPembayaran,
  TipeKelas,
} from "@prisma/client";

export const kelasRouter = createTRPCRouter({
  getKelasAktif: cabangProtectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;

      const filterCabangId = allowedCabangId ?? input?.cabangId;

      const whereClause: Prisma.KelasWhereInput = {};
      if (filterCabangId) {
        whereClause.cabangId = filterCabangId;
      }

      const kelas = await db.kelas.findMany({
        where: whereClause,
        distinct: ["cohortId"],
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
          cohortId: true,
          cabangId: true,
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

  getKelasAndCount: cabangProtectedProcedure
    .input(
      z
        .object({
          cabangId: z.string().optional(),
          tipeKelas: z.nativeEnum(TipeKelas).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;

      const filterCabangId = allowedCabangId ?? input?.cabangId;

      const whereClause: Prisma.KelasWhereInput = {};
      if (filterCabangId) whereClause.cabangId = filterCabangId;
      if (input?.tipeKelas) whereClause.tipe = input.tipeKelas as TipeKelas;

      const allKelasData = await db.kelas.findMany({
        where: whereClause,
        // distinct: ["cohortId"],
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
          cohortId: true,
          cabangId: true,
          historyGuruKelases: {
            where: {
              selesaiPada: null,
              statusGuru: "ACTIVE",
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
          sesiPertemuanKelases: {
            orderBy: {
              tanggalWaktu: "desc",
            },
            take: 1,
            select: {
              tanggalWaktu: true,
            },
          },
          pendaftaranKelases: {
            where: { isAktif: true },
          },
          jadwalKelas: {
            select: {
              id: true,
              hari: true,
            },
          },
          _count: {
            select: { sesiPertemuanKelases: true, pendaftaranKelases: true },
          },
        },
      });

      const filteredKelas = allKelasData.filter(
        (kelas) => kelas._count.sesiPertemuanKelases < 24,
      );

      return filteredKelas;
    }),

  getKelasById: cabangProtectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;

      const kelas = await db.kelas.findUnique({
        where: { id: input.id },
      });

      if (!kelas) return null;

      if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak memiliki akses ke data kelas dari cabang ini.",
        });
      }
      return kelas;
    }),

  getKelasHistory: cabangProtectedProcedure
    .input(z.object({ cohortId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;

      const sampleKelas = await db.kelas.findFirst({
        where: { cohortId: input.cohortId },
        select: { cabangId: true },
      });

      if (!sampleKelas) {
        return [];
      }

      if (allowedCabangId && sampleKelas.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak melihat riwayat kelas dari cabang lain.",
        });
      }

      const history = await ctx.db.kelas.findMany({
        where: { cohortId: input.cohortId },
        orderBy: { level: "asc" }, // Urutkan dari level terendah
        select: {
          id: true,
          kodeKelas: true,
          level: true,
          bulanTahunAjar: true,
          _count: {
            select: { pendaftaranKelases: true }, // Hitung jumlah murid historis
          },
        },
      });
      return history;
    }),

  /**
   * Query ini dirancang untuk halaman absensi guru.
   * Mengambil semua kelas, dan untuk setiap kelas, mengambil daftar sesi pertemuannya.
   */
  getKelasWithSesiForGuru: cabangProtectedProcedure.query(async ({ ctx }) => {
    const { db, session } = ctx;
    const guruId = session.user.id;

    const kelasWithSesi = await db.kelas.findMany({
      where: {
        // Filter kelas yang diajar oleh guru yang login & masih aktif
        historyGuruKelases: {
          some: {
            guruId: guruId,
            statusGuru: "ACTIVE",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        kodeKelas: true,
        // Ambil semua sesi pertemuan yang terkait dengan kelas ini
        sesiPertemuanKelases: {
          orderBy: {
            tanggalWaktu: "desc",
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

  getForExport: cabangProtectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;

      const filterCabangId = allowedCabangId ?? input?.cabangId;

      const whereClause: Prisma.KelasWhereInput = {};
      if (filterCabangId) {
        whereClause.cabangId = filterCabangId;
      }

      // 1. Ambil data mentah
      const allKelasData = await db.kelas.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        select: {
          kodeKelas: true,
          jenisKelas: true,
          level: true,
          grup: true,
          tipe: true,
          bulanTahunAjar: true,
          hargaKelas: true,

          // Info Guru Aktif
          historyGuruKelases: {
            where: { statusGuru: "ACTIVE" },
            select: {
              guru: { select: { name: true } },
            },
            take: 1,
          },

          // Info Jadwal (Hari)
          jadwalKelas: {
            select: { hari: true },
          },

          // Statistik (Murid & Sesi)
          _count: {
            select: {
              pendaftaranKelases: { where: { isAktif: true } },
              sesiPertemuanKelases: true,
            },
          },

          // Untuk filter manual (sesi < 24)
          sesiPertemuanKelases: {
            select: { id: true },
          },
        },
      });

      // 2. Filter Konsistensi (Sama seperti tampilan tabel: Sesi < 24)
      const filteredKelas = allKelasData.filter(
        (kelas) => kelas._count.sesiPertemuanKelases < 24,
      );

      return filteredKelas;
    }),

  createKelas: cabangProtectedProcedure
    .input(serverKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;

      const finalCabangId = allowedCabangId ?? input.cabangId;

      if (!finalCabangId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cabang ID harus ditentukan untuk membuat kelas.",
        });
      }

      try {
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
            cabangId: finalCabangId,
          },
        });
        return kelas;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2002: Unique Constraint (Kode Kelas sudah ada)
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Kelas dengan kode "${input.kodeKelas}" sudah ada.`,
            });
          }
        }
        throw error;
      }
    }),

  updateKelas: cabangProtectedProcedure
    .input(serverKelasSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;

      try {
        const oldKelas = await db.kelas.findUnique({
          where: { id: input.id },
          select: { hargaKelas: true, cabangId: true },
        });

        if (!oldKelas) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kelas tidak ditemukan",
          });
        }

        if (allowedCabangId && oldKelas.cabangId !== allowedCabangId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak berhak mengedit kelas dari cabang lain.",
          });
        }

        if (
          input.cabangId &&
          allowedCabangId &&
          input.cabangId !== allowedCabangId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak boleh memindahkan kelas ke cabang lain.",
          });
        }

        // 2. Cek apakah User mencoba mengubah harga?
        if (input.hargaKelas !== oldKelas.hargaKelas) {
          // 3. Cek apakah sudah ada transaksi (Pembayaran) atau Sesi yang berjalan
          const hasPembayaran = await db.pembayaran.findFirst({
            where: {
              pendaftaranKelas: { kelasId: input.id },
            },
            select: { id: true }, // Cukup ambil ID untuk efisiensi
          });

          // Opsi tambahan: Cek apakah sudah ada sesi berjalan
          const hasSesiPertemuan = await db.sesiPertemuanKelas.findFirst({
            where: { kelasId: input.id },
            select: { id: true },
          });

          if (hasPembayaran || hasSesiPertemuan) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED", // 412 Precondition Failed
              message:
                "Tidak dapat mengubah harga kelas yang sudah memiliki riwayat transaksi atau sesi berjalan. Silakan buat kelas baru untuk harga baru.",
            });
          }
        }
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
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Kelas dengan kode "${input.kodeKelas}" sudah ada.`,
            });
          }
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kelas tidak ditemukan (mungkin sudah dihapus).",
            });
          }
        }
        throw error;
      }
    }),

  deleteKelas: cabangProtectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;

      try {
        const existingKelas = await db.kelas.findUnique({
          where: { id: input.id },
          select: { cabangId: true },
        });

        if (!existingKelas) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kelas tidak ditemukan.",
          });
        }
        if (allowedCabangId && existingKelas.cabangId !== allowedCabangId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak berhak menghapus kelas dari cabang lain.",
          });
        }
        const existingMuridKelas = await db.pendaftaranKelas.findFirst({
          where: { kelasId: input.id },
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
        const kelas = await db.kelas.delete({
          where: { id: input.id },
        });
        return kelas;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kelas tidak ditemukan.",
            });
          }
        }
        throw error;
      }
    }),

  upLevelKelas: cabangProtectedProcedure
    .input(upLevelKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session, allowedCabangId } = ctx;
      const {
        oldKelasId,
        newLevel,
        newBulanTahunAjar,
        newKodeKelas,
        newTanggalMulai,
        hargaKelas,
      } = input;

      try {
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

        if (allowedCabangId && oldKelas.cabangId !== allowedCabangId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Anda tidak berhak melakukan Up Level pada kelas cabang lain.",
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
              deskripsi: oldKelas.deskripsi,
              cohortId: oldKelas.cohortId,
              cabangId: oldKelas.cabangId,
              // Override dengan input baru
              hargaKelas: hargaKelas,
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
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2002: Kode Kelas Baru bentrok
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Gagal Up Level: Kelas dengan kode "${newKodeKelas}" sudah ada.`,
            });
          }
        }
        throw error;
      }
    }),
});
