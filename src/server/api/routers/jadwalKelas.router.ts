import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { serverCreateBulkJadwalSchema } from "@/types/jadwalKelas.type";
import { TRPCError } from "@trpc/server";
import { Hari, Prisma } from "@prisma/client";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";
import z from "zod";
import { getRestrictedCabangId } from "@/server/utils/permission";

export const jadwalKelasRouter = createTRPCRouter({
  getScheduleMatrix: protectedProcedure
    .input(
      z.object({
        cabangId: z.string().optional(),
        hari: z.nativeEnum(Hari),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const finalCabangId = getRestrictedCabangId(session, input.cabangId);

      if (!finalCabangId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Harap pilih spesifik cabang untuk melihat Kalender Jadwal.",
        });
      }
      const whereClause: Prisma.JadwalKelasWhereInput = {};
      if (finalCabangId) whereClause.kelas = { cabangId: finalCabangId };

      // Optimasi: Jalankan 2 query secara paralel daripada nested deep include
      const [rooms, rawSchedules] = await Promise.all([
        // 1. Ambil Ruangan (Ringan)
        db.ruang.findMany({
          where: { cabangId: finalCabangId, isAktif: true },
          orderBy: { namaRuang: "asc" },
          select: { id: true, namaRuang: true },
        }),

        // 2. Ambil Jadwal (Terfilter specific hari & cabang)
        db.jadwalKelas.findMany({
          where: {
            hari: input.hari,
            ruang: {
              cabangId: finalCabangId,
            },
            ...whereClause,
          },
          select: {
            id: true,
            ruangId: true,
            kelasId: true,
            jamSlotTetap: {
              select: { jamMulai: true, jamSelesai: true },
            },
            jamSlotCustom: {
              select: { jamMulai: true, jamSelesai: true },
            },
            kelas: {
              select: {
                kodeKelas: true,
                tipe: true,
                // Optimasi: Ambil jumlah murid aktif saja
                _count: {
                  select: {
                    pendaftaranKelases: { where: { isAktif: true } },
                  },
                },
                // Optimasi: Ambil guru aktif saja
                historyGuruKelases: {
                  where: { statusGuru: "ACTIVE" },
                  take: 1,
                  select: {
                    guru: { select: { name: true } },
                  },
                },
              },
            },
          },
        }),
      ]);

      // 3. Formatting Data di level Aplikasi (Lebih cepat daripada DB formatting)
      const formattedSchedules = rawSchedules.map((s) => {
        const jam = s.jamSlotTetap ?? s.jamSlotCustom;

        return {
          id: s.id,
          ruangId: s.ruangId,
          kelasId: s.kelasId,
          kodeKelas: s.kelas.kodeKelas,
          tipeKelas: s.kelas.tipe,
          guru: s.kelas.historyGuruKelases[0]?.guru.name ?? "Belum ada guru",
          jamMulai: jam?.jamMulai ?? "00:00",
          jamSelesai: jam?.jamSelesai ?? "00:00",
          jumlahMurid: s.kelas._count.pendaftaranKelases,
        };
      });

      return {
        rooms,
        schedules: formattedSchedules,
      };
    }),
  /**
   * Membuat JadwalKelas baru.
   * Ini menangani kelas REGULAR (link ke JamSlotTetap)
   * dan kelas PRIVATE (membuat JamSlotCustom baru)
   */
  create: protectedProcedure
    .input(serverCreateBulkJadwalSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      try {
        const allowedCabangId = getRestrictedCabangId(session, null);

        // Gunakan transaction agar semua jadwal berhasil dibuat atau gagal semua
        const result = await db.$transaction(async (tx) => {
          const createdSchedules = [];

          // Loop setiap item jadwal yang dikirim dari FE
          for (const scheduleData of input) {
            const { kelasId, ruangId, hari, tipeJam } = scheduleData;

            const [kelas, ruang] = await Promise.all([
              tx.kelas.findUnique({
                where: { id: kelasId },
                select: { cabangId: true, kodeKelas: true },
              }),
              tx.ruang.findUnique({
                where: { id: ruangId },
                select: { cabangId: true, namaRuang: true },
              }),
            ]);

            if (!kelas || !ruang) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Kelas atau Ruang tidak ditemukan.",
              });
            }

            if (kelas.cabangId !== ruang.cabangId) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Konflik Data: Kelas ${kelas.kodeKelas} dan Ruang ${ruang.namaRuang} berbeda cabang.`,
              });
            }

            // B. Jika Admin, pastikan dia punya akses ke cabang tersebut
            if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Anda tidak berhak membuat jadwal di cabang lain.",
              });
            }

            let jamSlotCustomId: string | undefined = undefined;
            let jamSlotTetapId: string | undefined = undefined;
            let checkJamMulai = "";
            let checkJamSelesai = "";

            // --- LOGIKA PER CABANG (CUSTOM / TETAP) ---

            if (tipeJam === "CUSTOM") {
              // --- Alur Kelas Privat (Jam Custom) ---
              const { jamMulai, jamSelesai } = scheduleData;

              // Safety check (seharusnya sudah dicover Zod)
              if (!jamMulai || !jamSelesai) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message:
                    "Jam Mulai dan Selesai wajib diisi untuk jadwal Custom.",
                });
              }
              checkJamMulai = jamMulai;
              checkJamSelesai = jamSelesai;

              const existingJamCustom = await tx.jamSlotCustom.findFirst({
                where: { jamMulai, jamSelesai },
              });

              if (existingJamCustom) {
                jamSlotCustomId = existingJamCustom.id;
              } else {
                const newJamCustom = await tx.jamSlotCustom.create({
                  data: { jamMulai, jamSelesai },
                });
                jamSlotCustomId = newJamCustom.id;
              }
            } else if (tipeJam === "TETAP") {
              // --- Alur Kelas Reguler (Jam Tetap) ---
              jamSlotTetapId = scheduleData.jamSlotTetapId;

              // Validasi Konsistensi Cabang
              const [slot, ruang] = await Promise.all([
                tx.jamSlotTetap.findUnique({
                  where: { id: jamSlotTetapId },
                  select: { cabangId: true, jamMulai: true, jamSelesai: true },
                }),
                tx.ruang.findUnique({
                  where: { id: ruangId },
                  select: { cabangId: true, namaRuang: true },
                }),
              ]);

              if (!slot || !ruang) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Data Ruang atau Slot Jam tidak ditemukan.",
                });
              }

              if (slot.cabangId !== ruang.cabangId) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: `Konflik Cabang: Ruang dan Slot Jam harus berada di cabang yang sama (Hari: ${hari}).`,
                });
              }

              checkJamMulai = slot.jamMulai;
              checkJamSelesai = slot.jamSelesai;
            }

            const conflictingSchedule = await tx.jadwalKelas.findFirst({
              where: {
                hari: hari,
                ruangId: ruangId,
                // Logic overlapping:
                // (StartA < EndB) AND (EndA > StartB)
                // Kita cek apakah ada jadwal di DB (B) yang bertabrakan dengan input kita (A)
                OR: [
                  // Cek tabrakan dengan jadwal yang pakai slot TETAP
                  {
                    jamSlotTetap: {
                      jamMulai: { lt: checkJamSelesai },
                      jamSelesai: { gt: checkJamMulai },
                    },
                  },
                  // Cek tabrakan dengan jadwal yang pakai slot CUSTOM
                  {
                    jamSlotCustom: {
                      jamMulai: { lt: checkJamSelesai },
                      jamSelesai: { gt: checkJamMulai },
                    },
                  },
                ],
              },
              include: {
                kelas: { select: { kodeKelas: true } },
              },
            });

            if (conflictingSchedule) {
              throw new TRPCError({
                code: "CONFLICT",
                message: `Bentrok Jadwal! Ruang ini sudah dipakai oleh kelas ${conflictingSchedule.kelas.kodeKelas} pada jam yang beririsan di hari ${hari}.`,
              });
            }

            // --- BUAT JADWAL KELAS ---
            const createdJadwal = await tx.jadwalKelas.create({
              data: {
                kelasId: kelasId,
                ruangId: ruangId,
                hari: hari,
                jamSlotTetapId: jamSlotTetapId,
                jamSlotCustomId: jamSlotCustomId,
              },
            });

            createdSchedules.push(createdJadwal);
          }

          return createdSchedules;
        });

        return result;
      } catch (error) {
        // Handle Prisma Errors yang mungkin lolos dari validasi manual
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2003") {
            // Foreign key violation (misal kelasId/ruangId tidak valid/dihapus saat proses)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Terjadi kesalahan referensi data (Kelas atau Ruang mungkin tidak valid).",
            });
          }
        }
        // Lempar error TRPCError yang kita buat manual di atas (CONFLICT, NOT_FOUND)
        throw error;
      }
    }),

  getAll: protectedProcedure
    .input(z.object({ cabangId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const filterCabangId = getRestrictedCabangId(session, input?.cabangId);

      const whereClause: Prisma.JadwalKelasWhereInput = {};
      if (filterCabangId) {
        whereClause.kelas = {
          cabangId: filterCabangId,
        };
      }

      return db.jadwalKelas.findMany({
        where: whereClause,
        orderBy: {
          hari: "asc",
        },
        include: {
          kelas: { select: { kodeKelas: true, jenisKelas: true } },
          ruang: {
            select: {
              namaRuang: true,
              cabang: { select: { namaCabang: true } },
            },
          },
          jamSlotTetap: true,
          jamSlotCustom: true,
        },
      });
    }),

  getJadwalHariIniForGuru: protectedProcedure
    .input(
      z
        .object({
          guruId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const targetGuruId = input?.guruId ?? session.user.id;

      // const hariIni = "SABTU" as Hari;
      const now = dayjs().tz(TIMEZONE_BISNIS);
      const hariIni = now.format("dddd").toUpperCase() as Hari;
      const tanggalHariIniStr = now.format("YYYY-MM-DD");

      // 2. Cari semua JadwalKelas untuk guru ini yang aktif hari ini
      const jadwalHariIni = await db.jadwalKelas.findMany({
        where: {
          // Filter berdasarkan hari
          hari: hariIni,
          kelas: {
            historyGuruKelases: {
              some: {
                guruId: targetGuruId,
                statusGuru: "ACTIVE",
                mulaiPada: {
                  lte: tanggalHariIniStr,
                },
              },
            },
          },
        },
        select: {
          id: true, // ID JadwalKelas (untuk "Mulai Sesi")
          kelasId: true,
          ruangId: true,
          kelas: {
            select: {
              kodeKelas: true,
              historyGuruKelases: {
                where: {
                  statusGuru: "ACTIVE",
                },
                select: {
                  guru: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
          ruang: {
            select: {
              namaRuang: true,
            },
          },
          // Ambil jam dari kedua kemungkinan sumber
          jamSlotTetap: {
            select: {
              jamMulai: true,
              jamSelesai: true,
            },
          },
          jamSlotCustom: {
            select: {
              jamMulai: true,
              jamSelesai: true,
            },
          },
        },
        orderBy: [
          { jamSlotTetap: { jamMulai: "asc" } },
          { jamSlotCustom: { jamMulai: "asc" } },
        ],
      });

      // 3. (Opsional tapi Direkomendasikan) Cek sesi yang sudah dibuat hari ini
      const hariIniStart = dayjs().tz(TIMEZONE_BISNIS).startOf("day").toDate();
      const hariIniEnd = dayjs().tz(TIMEZONE_BISNIS).endOf("day").toDate();

      const sesiSudahDibuat = await db.sesiPertemuanKelas.findMany({
        where: {
          jadwalKelasId: {
            in: jadwalHariIni.map((j) => j.id),
          },
          tanggalWaktu: {
            gte: hariIniStart,
            lte: hariIniEnd,
          },
        },
        select: {
          id: true, // ID SesiPertemuanKelas
          jadwalKelasId: true,
        },
      });

      const sesiMap = new Map(
        sesiSudahDibuat.map((s) => [s.jadwalKelasId, s.id]),
      );

      // 4. Proses data agar rapi untuk UI
      const hasil = jadwalHariIni.map((jadwal) => {
        const jam = jadwal.jamSlotTetap ?? jadwal.jamSlotCustom;
        const sesiId = sesiMap.get(jadwal.id) ?? null;
        const guruAktif = jadwal.kelas.historyGuruKelases[0]?.guru;

        return {
          jadwalId: jadwal.id,
          kelasId: jadwal.kelasId,
          ruangId: jadwal.ruangId,
          kodeKelas: jadwal.kelas.kodeKelas,
          namaRuang: jadwal.ruang.namaRuang,
          jamMulai: jam?.jamMulai ?? "N/A",
          jamSelesai: jam?.jamSelesai ?? "N/A",
          guru: guruAktif ? { id: guruAktif.id, name: guruAktif.name } : null,
          sesiIdSudahDibuat: sesiId,
          isJadwalPengganti: targetGuruId !== session.user.id,
        };
      });

      return hasil;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const existingJadwal = await db.jadwalKelas.findUnique({
        where: { id: input.id },
        include: { kelas: { select: { cabangId: true } } },
      });

      if (!existingJadwal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Jadwal tidak ditemukan atau sudah dihapus.",
        });
      }

      // 2. Validasi Akses
      const allowedCabangId = getRestrictedCabangId(session, null);
      if (
        allowedCabangId &&
        existingJadwal.kelas.cabangId !== allowedCabangId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak berhak menghapus jadwal dari cabang lain.",
        });
      }

      try {
        await db.jadwalKelas.delete({
          where: { id: input.id },
        });
        return { success: true };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Jadwal tidak ditemukan atau sudah dihapus.",
            });
          }
          // P2003: Jika suatu hari Anda mengubah relasi SesiPertemuan ke RESTRICT
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "Jadwal ini sudah memiliki riwayat Sesi Pertemuan dan tidak dapat dihapus.",
            });
          }
        }
        throw error;
      }
    }),
});
