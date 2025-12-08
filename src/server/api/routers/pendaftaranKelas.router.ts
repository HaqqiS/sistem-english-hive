import {
  serverBulkPendaftaranKelasSchema,
  serverPendaftaranKelasSchema,
  serverUpdatePendaftaranKelasSchema,
} from "@/types/pendaftaranKelas.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import dayjs from "dayjs";
import { TRPCError } from "@trpc/server";
import { Prisma, StatusMurid, StatusPembayaran } from "@prisma/client";
import z from "zod";
import { JUMLAH_PERTEMUAN_PER_BLOK } from "@/constants/pembayaran";
import { calculateInitialBill } from "@/server/services/pembayaran.service";
import { getRestrictedCabangId } from "@/server/utils/permission";

export const pendaftaranKelasRouter = createTRPCRouter({
  getPendaftarByKelasId: protectedProcedure
    .input(serverPendaftaranKelasSchema.pick({ kelasId: true }))
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const kelas = await db.kelas.findUnique({
        where: { id: input.kelasId },
        select: { cabangId: true },
      });

      if (!kelas) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kelas tidak ditemukan",
        });
      }
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Anda tidak berhak melihat pendaftar kelas dari cabang lain.",
        });
      }

      const pendaftaranKelas = await db.pendaftaranKelas.findMany({
        where: {
          kelasId: input.kelasId,
        },
        include: {
          murid: {
            select: {
              namaLengkap: true,
              email: true,
              cabangId: true,
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
      const { db, session } = ctx;

      const [murid, kelas] = await Promise.all([
        db.murid.findUnique({
          where: { id: input.muridId },
          select: { cabangId: true, namaLengkap: true, statusMurid: true },
        }),
        db.kelas.findUnique({
          where: { id: input.kelasId },
          select: {
            cabangId: true,
            hargaKelas: true,
            kodeKelas: true,
            cohortId: true,
            level: true,
          },
        }),
      ]);

      if (!murid || !kelas) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Murid atau Kelas tidak ditemukan.",
        });
      }

      // 2. Validasi Konsistensi Data (Murid & Kelas harus satu cabang)
      if (murid.cabangId !== kelas.cabangId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Konflik Cabang: Murid ${murid.namaLengkap} dan Kelas ${kelas.kodeKelas} berbeda cabang.`,
        });
      }

      // 3. Security Check (Admin)
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mendaftarkan siswa di cabang lain.",
        });
      }

      // 4. Cek Apakah Sudah Terdaftar di Kelas Ini (Aktif)
      const existingRegistration = await db.pendaftaranKelas.findFirst({
        where: {
          muridId: input.muridId,
          kelasId: input.kelasId,
          isAktif: true,
        },
      });

      if (existingRegistration) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Murid sudah terdaftar aktif di kelas ini.",
        });
      }

      try {
        // 1. Kita butuh harga kelas untuk tagihan
        const kelas = await db.kelas.findUnique({
          where: { id: input.kelasId },
          select: {
            hargaKelas: true,
            kodeKelas: true,
            cohortId: true,
            level: true,
          },
        });

        if (!kelas) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kelas yang dipilih tidak ditemukan.",
          });
        }

        // Validasi Duplikat Pendaftaran Aktif
        const existingActive = await db.pendaftaranKelas.findFirst({
          where: { muridId: input.muridId, isAktif: true },
        });
        if (existingActive) {
          // Gunakan TRPCError dan pesan yang benar
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Murid ini sudah terdaftar di kelas lain yang masih aktif. Nonaktifkan pendaftaran lama terlebih dahulu.",
          });
        }

        const jumlahSesiBerlalu = await db.sesiPertemuanKelas.count({
          where: { kelasId: input.kelasId },
        });

        // 3. Kalkulasi Tagihan (Menggunakan Service)
        let billInfo;
        try {
          billInfo = calculateInitialBill(kelas.hargaKelas, jumlahSesiBerlalu);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            message: error.message,
          });
        }

        // Sesi dimana murid ini akan mulai masuk (Sesi Berikutnya)

        // 4. EKSEKUSI TRANSACTION
        const result = await db.$transaction(async (tx) => {
          // A. Create Pendaftaran Utama (Level Ini)
          const pendaftaran = await tx.pendaftaranKelas.create({
            data: {
              ...input,
              isAktif: true,
            },
          });

          // B. Create Tagihan Utama
          await tx.pembayaran.create({
            data: {
              pendaftaranKelasId: pendaftaran.id,
              pembayaranKe: billInfo.pembayaranKe,
              jumlahBayar: billInfo.totalTagihan,
              tanggalJatuhTempo: dayjs(input.tanggalMulai).toDate(),
              statusBayar: StatusPembayaran.BELUM_LUNAS,
              note: billInfo.note,
            },
          });

          // C. CEK "VERY LATE JOINER" (Sesi 21-24)
          // Jika murid masuk setelah trigger level up (Sesi 20),
          // Cek apakah kelas masa depan sudah dibuat?
          let nextLevelRegistrationId: string | null = null;

          if (billInfo.sesiMasuk > 20) {
            const nextClass = await tx.kelas.findFirst({
              where: {
                cohortId: kelas.cohortId,
                level: kelas.level + 1,
              },
              orderBy: { createdAt: "desc" },
            });

            if (nextClass) {
              const nextStartDate = dayjs(input.tanggalMulai)
                .add(1, "month")
                .format("YYYY-MM-DD");

              const nextReg = await tx.pendaftaranKelas.create({
                data: {
                  muridId: input.muridId,
                  kelasId: nextClass.id,
                  tanggalMulai: nextStartDate,
                  isAktif: true,
                },
              });
              nextLevelRegistrationId = nextReg.id;

              // Tagihan Pending Level Berikutnya
              const tagihanNext =
                nextClass.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;

              await tx.pembayaran.create({
                data: {
                  pendaftaranKelasId: nextReg.id,
                  pembayaranKe: 1,
                  jumlahBayar: tagihanNext,
                  tanggalJatuhTempo: dayjs(nextStartDate).toDate(),
                  statusBayar: StatusPembayaran.PENDING,
                  note: "Auto-Registration (Very Late Joiner Lvl Sebelumnya)",
                },
              });
            }
          }

          return { pendaftaran, nextLevelRegistrationId };
        });

        return result.pendaftaran;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Data Murid atau Kelas tidak valid.",
            });
          }
        }
        throw error;
      }
    }),

  createBulkPendaftaranKelas: protectedProcedure
    .input(serverBulkPendaftaranKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { muridIds, kelasId, tanggalMulai } = input;

      const kelas = await db.kelas.findUnique({
        where: { id: kelasId },
        select: { hargaKelas: true, cabangId: true },
      });
      if (!kelas)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kelas tidak ditemukan",
        });

      // Security Check
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mendaftarkan siswa di cabang lain.",
        });
      }

      // Validasi Bulk Murid (Semua harus di cabang yang sama)
      const muridCount = await db.murid.count({
        where: {
          id: { in: muridIds },
          cabangId: kelas.cabangId,
        },
      });

      if (muridCount !== muridIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Beberapa murid tidak ditemukan atau berasal dari cabang berbeda.",
        });
      }

      // Validasi Duplikat
      const existingActive = await db.pendaftaranKelas.findMany({
        where: { muridId: { in: muridIds }, isAktif: true },
        include: { murid: true },
      });
      if (existingActive.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Beberapa murid sudah aktif: ${existingActive.map((p) => p.murid.namaLengkap).join(", ")}`,
        });
      }

      try {
        const kelas = await db.kelas.findUnique({
          where: { id: kelasId },
          select: { hargaKelas: true, kodeKelas: true },
        });
        if (!kelas) throw new TRPCError({ code: "NOT_FOUND" });

        // Validasi Bulk
        const existingActive = await db.pendaftaranKelas.findMany({
          where: { muridId: { in: muridIds }, isAktif: true },
          include: { murid: true },
        });
        if (existingActive.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Beberapa murid sudah aktif: ${existingActive.map((p) => p.murid.namaLengkap).join(", ")}`,
          });
        }

        // Transaction
        await db.$transaction(async (tx) => {
          const tglMulaiDate = dayjs(tanggalMulai).toDate();
          const totalTagihan = kelas.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;

          for (const muridId of muridIds) {
            const pendaftaran = await tx.pendaftaranKelas.create({
              data: {
                muridId,
                kelasId,
                tanggalMulai,
                isAktif: true,
              },
            });

            await tx.pembayaran.create({
              data: {
                pendaftaranKelasId: pendaftaran.id,
                pembayaranKe: 1,
                jumlahBayar: totalTagihan,
                tanggalJatuhTempo: tglMulaiDate,
                statusBayar: StatusPembayaran.BELUM_LUNAS,
                note: "Tagihan Awal (Bulk Registration)",
              },
            });
          }
        });

        return { success: true, count: muridIds.length };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            // Jika ada duplikasi yang lolos validasi manual
            throw new TRPCError({
              code: "CONFLICT",
              message: "Terjadi duplikasi data pendaftaran.",
            });
          }
        }
        throw error;
      }
    }),

  updatePendaftaranKelas: protectedProcedure
    .input(serverUpdatePendaftaranKelasSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const existingRecord = await db.pendaftaranKelas.findUnique({
        where: { id: input.id },
        include: {
          Kelas: {
            select: {
              cabangId: true,
              cohortId: true,
              level: true,
              hargaKelas: true,
            },
          },
        },
      });

      if (!existingRecord) throw new TRPCError({ code: "NOT_FOUND" });

      // Security Check
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (
        allowedCabangId &&
        existingRecord.Kelas.cabangId !== allowedCabangId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak mengedit pendaftaran cabang lain.",
        });
      }

      // Jika ganti kelas, pastikan kelas baru juga di cabang yang sama (kecuali Manager)
      if (input.kelasId && input.kelasId !== existingRecord.kelasId) {
        const targetKelas = await db.kelas.findUnique({
          where: { id: input.kelasId },
          select: { cabangId: true, hargaKelas: true },
        });
        if (!targetKelas)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kelas tujuan tidak ditemukan",
          });

        if (allowedCabangId && targetKelas.cabangId !== allowedCabangId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Tidak dapat memindahkan siswa ke kelas di cabang lain.",
          });
        }
      }

      try {
        // 1. Ambil data lama
        const existingRecord = await db.pendaftaranKelas.findUnique({
          where: { id: input.id },
          include: { Kelas: true },
        });

        if (!existingRecord) throw new TRPCError({ code: "NOT_FOUND" });

        return await db.$transaction(async (tx) => {
          // === SKEMA 1: TRANSFER KELAS / GANTI MURID (Hard Change) ===
          // Jika Admin mengubah Kelas atau Murid, kita anggap ini perpindahan.
          // Cara aman: Matikan record lama, buat record baru (agar history bayar lama tetap tercatat di kelas lama).
          if (
            (input.kelasId && input.kelasId !== existingRecord.kelasId) ||
            (input.muridId && input.muridId !== existingRecord.muridId)
          ) {
            // 1a. Non-aktifkan pendaftaran lama
            await tx.pendaftaranKelas.update({
              where: { id: input.id },
              data: { isAktif: false },
            });

            // 1b. Buat Pendaftaran Baru
            const newRegistration = await tx.pendaftaranKelas.create({
              data: {
                muridId: input.muridId ?? existingRecord.muridId,
                kelasId: input.kelasId ?? existingRecord.kelasId,
                tanggalMulai: input.tanggalMulai, // Tanggal mulai di kelas baru
                isAktif: true,
              },
            });

            // 1c. Pindahkan Tagihan BELUM LUNAS ke Pendaftaran Baru (Opsional tapi Bagus)
            // Atau buat tagihan baru. Di sini kita buat tagihan transfer simpel.
            const targetKelas = await tx.kelas.findUnique({
              where: { id: input.kelasId ?? existingRecord.kelasId },
            });

            if (targetKelas) {
              await tx.pembayaran.create({
                data: {
                  pendaftaranKelasId: newRegistration.id,
                  pembayaranKe: 1,
                  jumlahBayar: targetKelas.hargaKelas * 8, // Atau logika prorate
                  statusBayar: StatusPembayaran.BELUM_LUNAS,
                  tanggalJatuhTempo: new Date(input.tanggalMulai),
                  note: "Tagihan Pindahan Kelas / Koreksi Data",
                },
              });
            }

            return newRegistration; // Return data baru
          }

          // === SKEMA 2 & 3: UPDATE STATUS (Soft Change) ===

          // A. Jika Status Berubah jadi NON-AKTIF (Berhenti)
          if (input.isAktif === false && existingRecord.isAktif === true) {
            // Cleanup 1: Hapus pendaftaran masa depan (Logic Anda yang sudah bagus)
            const nextLevelRegistration = await tx.pendaftaranKelas.findFirst({
              where: {
                muridId: existingRecord.muridId,
                Kelas: {
                  cohortId: existingRecord.Kelas.cohortId,
                  level: { gt: existingRecord.Kelas.level },
                },
                // Pastikan hanya menghapus yang belum ada pembayaran lunas
                pembayarans: {
                  every: { statusBayar: { not: StatusPembayaran.LUNAS } },
                },
              },
            });

            if (nextLevelRegistration) {
              await tx.pendaftaranKelas.delete({
                where: { id: nextLevelRegistration.id },
              });
            }

            // Cleanup 2: [BARU] Hapus tagihan 'gantung' di level ini
            // Hapus tagihan BELUM LUNAS yang dibuat otomatis (bukan manual) agar tidak jadi piutang macet
            await tx.pembayaran.deleteMany({
              where: {
                pendaftaranKelasId: input.id,
                statusBayar: {
                  in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
                },
                note: { contains: "Auto-Generate" }, // Safety: Hanya hapus yg auto
              },
            });
          }

          // B. Jika Status Berubah jadi AKTIF (Re-Join)
          if (input.isAktif === true && existingRecord.isAktif === false) {
            // Opsional: Cek apakah perlu generate tagihan baru?
            // Untuk amannya, biarkan Guru trigger tagihan lewat absensi pertama,
            // atau Admin buat tagihan manual lewat menu Pembayaran.
          }

          // Update Biasa
          return tx.pendaftaranKelas.update({
            where: { id: input.id },
            data: {
              tanggalMulai: input.tanggalMulai,
              isAktif: input.isAktif,
            },
          });
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Data pendaftaran sudah dihapus.",
            });
          }
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Data Kelas/Murid baru tidak valid.",
            });
          }
        }
        throw error;
      }
    }),

  deletePendaftaranKelas: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const existingPendaftaran = await db.pendaftaranKelas.findUnique({
        where: { id: input.id },
        include: { Kelas: { select: { cabangId: true } } },
      });

      if (!existingPendaftaran) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data pendaftaran tidak ditemukan.",
        });
      }

      // Security Check
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (
        allowedCabangId &&
        existingPendaftaran.Kelas.cabangId !== allowedCabangId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak menghapus pendaftaran dari cabang lain.",
        });
      }

      try {
        const exists = await db.pendaftaranKelas.findUnique({
          where: { id: input.id },
        });

        if (!exists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data pendaftaran tidak ditemukan.",
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
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Pendaftaran sudah tidak ada.",
            });
          }
        }
        throw error;
      }
    }),
});
