// src/types/jadwalKelas.type.ts

import { z } from "zod";
import { Hari } from "@prisma/client"; // Pastikan untuk mengimpor Enum 'Hari'
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { RouterOutputs } from "@/trpc/react";

// Aktifkan plugin untuk mem-parsing string "HH:mm"
dayjs.extend(customParseFormat);

export type TypeJadwalHariIni =
  RouterOutputs["jadwalKelas"]["getJadwalHariIniForGuru"];
export type TypeJadwalHariIniItem = TypeJadwalHariIni[number];
export type TypeJadwalKelas = RouterOutputs["jadwalKelas"]["getAll"][number];

/**
 * Skema dasar yang dibutuhkan oleh kedua tipe jadwal.
 */
const baseJadwalSchema = z.object({
  kelasId: z.string().cuid("Kelas tidak valid"),
  ruangId: z.string().cuid("Ruang tidak valid"),
  hari: z.nativeEnum(Hari, {
    errorMap: () => ({ message: "Pilih hari yang valid" }),
  }),
});

/**
 * Skema untuk JADWAL REGULER.
 * Kita hanya butuh ID slot jam tetap.
 */
const regulerJadwalSchema = baseJadwalSchema.extend({
  tipeJam: z.literal("TETAP", {
    errorMap: () => ({ message: "Pilih waktu yang valid" }),
  }),
  jamSlotTetapId: z.string().cuid("ID Slot Jam Tetap tidak valid"),
  // Pastikan field jam custom tidak terkirim
  jamMulai: z.undefined().optional(),
  jamSelesai: z.undefined().optional(),
});

/**
 * Skema untuk JADWAL PRIVAT (CUSTOM).
 * Kita butuh jamMulai dan jamSelesai manual.
 */
const customJadwalSchema = baseJadwalSchema
  .extend({
    tipeJam: z.literal("CUSTOM", {
      errorMap: () => ({ message: "Pilih waktu yang valid" }),
    }),
    // Pastikan ID slot tetap tidak terkirim
    jamSlotTetapId: z.undefined().optional(),
    jamMulai: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam mulai HH:MM"),
    jamSelesai: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam selesai HH:MM"),
  })
  // Validasi 1: Pastikan jam selesai setelah jam mulai
  .refine(
    (data) => {
      const tMulai = dayjs(data.jamMulai, "HH:mm");
      const tSelesai = dayjs(data.jamSelesai, "HH:mm");
      // Jika salah satu invalid (karena regex gagal), loloskan refine ini
      // (error regex akan ditampilkan)
      if (!tMulai.isValid() || !tSelesai.isValid()) return true;
      return tSelesai.isAfter(tMulai);
    },
    {
      message: "Jam selesai harus setelah jam mulai",
      path: ["jamSelesai"],
    },
  )
  // Validasi 2: Pastikan durasi maksimal 90 menit
  .refine(
    (data) => {
      const tMulai = dayjs(data.jamMulai, "HH:mm");
      const tSelesai = dayjs(data.jamSelesai, "HH:mm");
      if (!tMulai.isValid() || !tSelesai.isValid()) return true;

      const durasiMenit = tSelesai.diff(tMulai, "minute");
      return durasiMenit === 90; // Durasi maksimal 90 menit
    },
    (data) => {
      // Pesan error dinamis
      const tMulai = dayjs(data.jamMulai, "HH:mm");
      const tSelesai = dayjs(data.jamSelesai, "HH:mm");
      const durasiMenit =
        tMulai.isValid() && tSelesai.isValid()
          ? tSelesai.diff(tMulai, "minute")
          : "N/A";
      return {
        message: `Durasi kelas privat tidak boleh lebih dari 90 menit. (Saat ini: ${durasiMenit} menit)`,
        path: ["jamSelesai"],
      };
    },
  );

/**
 * Skema final yang akan digunakan oleh router tRPC.
 * Zod akan otomatis memvalidasi berdasarkan nilai `tipeJam`.
 */
export const serverCreateJadwalSchema = z.union([
  regulerJadwalSchema,
  customJadwalSchema,
]);

export type TypeServerCreateJadwalSchema = z.infer<
  typeof serverCreateJadwalSchema
>;

export const serverCreateBulkJadwalSchema = z
  .array(serverCreateJadwalSchema)
  .min(1, "Minimal satu jadwal harus diisi")
  .max(2, "Maksimal dua jadwal sekaligus");

export type TypeServerCreateBulkJadwalSchema = z.infer<
  typeof serverCreateBulkJadwalSchema
>;
