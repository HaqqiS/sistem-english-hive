import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { serverCreateBulkJadwalSchema } from "@/types/jadwalKelas.type";
import { TRPCError } from "@trpc/server";
import { Hari } from "@prisma/client";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";
import z from "zod";

export const jadwalKelasRouter = createTRPCRouter({
  getScheduleMatrix: protectedProcedure
    .input(
      z.object({
        cabangId: z.string().min(1, "Cabang harus dipilih"),
        hari: z.nativeEnum(Hari),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;

      // Optimasi: Jalankan 2 query secara paralel daripada nested deep include
      const [rooms, rawSchedules] = await Promise.all([
        // 1. Ambil Ruangan (Ringan)
        db.ruang.findMany({
          where: { cabangId: input.cabangId, isAktif: true },
          orderBy: { namaRuang: "asc" },
          select: { id: true, namaRuang: true },
        }),

        // 2. Ambil Jadwal (Terfilter specific hari & cabang)
        db.jadwalKelas.findMany({
          where: {
            hari: input.hari,
            ruang: {
              cabangId: input.cabangId,
            },
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
      const { db } = ctx;

      // Gunakan transaction agar semua jadwal berhasil dibuat atau gagal semua
      const result = await db.$transaction(async (tx) => {
        const createdSchedules = [];

        // Loop setiap item jadwal yang dikirim dari FE
        for (const scheduleData of input) {
          const { kelasId, ruangId, hari, tipeJam } = scheduleData;

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
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    return db.jadwalKelas.findMany({
      orderBy: {
        hari: "asc",
      },
      include: {
        kelas: { select: { kodeKelas: true, jenisKelas: true } },
        ruang: {
          select: { namaRuang: true, cabang: { select: { namaCabang: true } } },
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
      const hariIni = dayjs()
        .tz(TIMEZONE_BISNIS)
        .format("dddd")
        .toUpperCase() as Hari;

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
      const { db } = ctx;

      const jadwal = await db.jadwalKelas.findUnique({
        where: { id: input.id },
        select: { jamSlotCustomId: true },
      });

      if (!jadwal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Jadwal tidak ditemukan",
        });
      }

      // Hapus Jadwal
      await db.jadwalKelas.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
});
