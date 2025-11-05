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
