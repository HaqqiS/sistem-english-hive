import type { RouterOutputs } from "@/trpc/react";
import { StatusAbsenGuru } from "@prisma/client";
import z from "zod";

export type TypeAbsensiGuru =
  RouterOutputs["absenGuru"]["getAllAbsensi"][number];

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
  // Kita bungkus array-nya dalam properti 'absensi'
  // Ini adalah nama yang akan digunakan oleh useFieldArray
  absensi: serverCreateManyAbsensiGuruSchema, // Menggunakan lagi skema array Anda
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

// Skema untuk keseluruhan form (array dari item)
export const formSesiAbsensiGuruSchema = z.object({
  absensi: z
    .array(createSesiAbsensiGuruSchema)
    .min(1, "Minimal satu absensi harus diisi")
    .max(5, "Maksimal 5 absensi per input"),
});

// Tipe untuk Form (Client-side)
export type TypeFormSesiAbsensiGuru = z.infer<typeof formSesiAbsensiGuruSchema>;

// Skema ini akan digunakan oleh endpoint tRPC (Backend)
// Backend akan menerima ARRAY langsung, bukan objek { absensi: [...] }
export const serverCreateSesiAbsensiGuruSchema = z.array(
  createSesiAbsensiGuruSchema,
);
export type TypeServerCreateSesiAbsensiGuru = z.infer<
  typeof serverCreateSesiAbsensiGuruSchema
>;
