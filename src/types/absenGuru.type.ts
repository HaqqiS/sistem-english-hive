import type { RouterOutputs } from "@/trpc/react";
import { StatusAbsenGuru } from "@prisma/client";
import z from "zod";

export type TypeAbsensiGuru =
  RouterOutputs["absenGuru"]["getAllAbsensi"][number];

export type TypeAbsensiGuruHistory =
  RouterOutputs["absenGuru"]["getHistoryByGuruId"];
export type TypeAbsensiGuruHistoryItem = TypeAbsensiGuruHistory[number];

export const serverStartSesiSchema = z.object({
  /**
   * ID dari JadwalKelas (rencana jadwal) yang dipilih guru.
   */
  jadwalKelasId: z.string().cuid("ID Jadwal tidak valid"),
  /**
   * Status kehadiran guru itu sendiri (misal: "HADIR").
   */
  status: z.nativeEnum(StatusAbsenGuru, {
    errorMap: () => ({ message: "Status absen guru tidak valid" }),
  }),
  /**
   * ID Ruang baru JIKA guru pindah ruang.
   * Jika null/undefined, kita akan pakai ruangId dari JadwalKelas.
   */
  overrideRuangId: z.string().cuid("ID Ruang tidak valid").optional(),
});

export const singleAbsensiGuruSchema = z.object({
  jadwalSesiId: z.string(),
  status: z.nativeEnum(StatusAbsenGuru),
});
export const serverCreateManyAbsensiGuruSchema = z
  .array(singleAbsensiGuruSchema)
  .min(1, "Data absensi tidak boleh kosong")
  .max(5, "Maksimal 5 data absensi dalam satu kali input");

type TypeAbsensiGuruSchema = z.infer<typeof singleAbsensiGuruSchema>;

export type TypeClientAbsensiGuruSchema = Omit<TypeAbsensiGuruSchema, "guruId">;

export const clientAbsensiArraySchema = z.object({
  absensi: serverCreateManyAbsensiGuruSchema,
});

export type TypeClientAbsensiArraySchema = z.infer<
  typeof clientAbsensiArraySchema
>;

export const createSesiAbsensiGuruSchema = z.object({
  kelasId: z.string().min(1, "Kelas wajib diisi"),
  ruangId: z.string().min(1, "Ruang wajib diisi"),
  tanggalWaktu: z.date({ required_error: "Tanggal wajib diisi" }),
  status: z.nativeEnum(StatusAbsenGuru),
});

export const formSesiAbsensiGuruSchema = z.object({
  absensi: z
    .array(createSesiAbsensiGuruSchema)
    .min(1, "Minimal satu absensi harus diisi")
    .max(5, "Maksimal 5 absensi per input"),
});

// Tipe untuk Form (Client-side)
export type TypeFormSesiAbsensiGuru = z.infer<typeof formSesiAbsensiGuruSchema>;

export const serverCreateSesiAbsensiGuruSchema = z.array(
  createSesiAbsensiGuruSchema,
);
export type TypeServerCreateSesiAbsensiGuru = z.infer<
  typeof serverCreateSesiAbsensiGuruSchema
>;
