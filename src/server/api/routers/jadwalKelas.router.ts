import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { serverCreateJadwalSchema } from "@/types/jadwalKelas.type";
import { TRPCError } from "@trpc/server";
import type { Hari } from "@prisma/client";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";
import z from "zod";

export const jadwalKelasRouter = createTRPCRouter({
  /**
   * Membuat JadwalKelas baru.
   * Ini menangani kelas REGULAR (link ke JamSlotTetap)
   * dan kelas PRIVATE (membuat JamSlotCustom baru)
   */
  create: protectedProcedure
    .input(serverCreateJadwalSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { kelasId, ruangId, hari, tipeJam } = input;

      // Kita gunakan transaction untuk memastikan
      // JamSlotCustom (jika ada) dan JadwalKelas dibuat bersamaan.
      const newJadwal = await db.$transaction(async (tx) => {
        let jamSlotCustomId: string | undefined = undefined;
        let jamSlotTetapId: string | undefined = undefined;

        // Cek tipe jadwal yang dikirim dari UI
        if (tipeJam === "CUSTOM") {
          // --- Alur Kelas Privat ---
          // 1. Buat dulu entri JamSlotCustom
          const newJamCustom = await tx.jamSlotCustom.create({
            data: {
              jamMulai: input.jamMulai, // 'input.jamMulai' dijamin ada & valid oleh Zod
              jamSelesai: input.jamSelesai, // 'input.jamSelesai' dijamin ada & valid oleh Zod
            },
          });
          jamSlotCustomId = newJamCustom.id;
        } else if (tipeJam === "TETAP") {
          // --- Alur Kelas Reguler ---
          // 1. Cukup catat ID-nya.
          jamSlotTetapId = input.jamSlotTetapId; // 'input.jamSlotTetapId' dijamin ada

          // (Validasi Ekstra Opsional tapi Direkomendasikan)
          // Cek apakah slot jam & ruang ada di cabang yang sama
          const slot = await tx.jamSlotTetap.findUnique({
            where: { id: jamSlotTetapId },
            select: { cabangId: true },
          });
          const ruang = await tx.ruang.findUnique({
            where: { id: ruangId },
            select: { cabangId: true },
          });

          if (slot?.cabangId !== ruang?.cabangId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cabang dari Slot Jam dan Ruangan tidak cocok.",
            });
          }
        }

        // 2. Buat JadwalKelas yang menunjuk ke slot yang benar
        const createdJadwal = await tx.jadwalKelas.create({
          data: {
            kelasId: kelasId,
            ruangId: ruangId,
            hari: hari,
            jamSlotTetapId: jamSlotTetapId, // Akan null jika privat
            jamSlotCustomId: jamSlotCustomId, // Akan null jika reguler
          },
        });

        return createdJadwal;
      });

      return newJadwal;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    // TODO: Tambahkan pagination nanti
    return db.jadwalKelas.findMany({
      orderBy: {
        hari: "asc", // Urutkan Senin -> Minggu (perlu mapping enum jika ingin akurat)
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

  getByKelasId: protectedProcedure
    .input(z.object({ kelasId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.jadwalKelas.findMany({
        where: { kelasId: input.kelasId },
        include: {
          ruang: true,
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
