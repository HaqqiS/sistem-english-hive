import type { RouterOutputs } from "@/trpc/react";
import { JenisKelas, TipeKelas } from "@prisma/client";
import z from "zod";

export type KelasType = RouterOutputs["kelas"]["getAll"][number];
export type CreateKelasType = RouterOutputs["kelas"]["createKelas"];

const baseKelasSchema = z.object({
  jenisKelas: z.nativeEnum(JenisKelas),
  level: z.coerce.number().min(1, "Level harus diisi").max(10),
  tipe: z.nativeEnum(TipeKelas),
  grup: z
    .string()
    .min(1, "Grup harus diisi. contoh: A")
    .max(2, "Grup maksimal 2 huruf")
    .regex(/^[a-zA-Z]+$/, "Grup hanya boleh berisi huruf"),
  bulanTahunAjar: z
    .string()
    .min(7, "Bulan/Tahun Ajar harus diisi. contoh: 03/2025")
    .max(7), //"MM/YYYY" e.g., "03/2025"
  deskripsi: z.string().optional(),
  hargaKelas: z.coerce.number().min(0, "Harga Kelas harus diisi"),
  kodeKelas: z.string().min(1, "Kode Kelas harus diisi").max(50), //e.g, TinyTods 1-A|reguler|03/2025
});

export const clientKelasSchema = baseKelasSchema.extend({});

export type TypeClientKelasSchema = z.infer<typeof clientKelasSchema>;

export const serverKelasSchema = baseKelasSchema;
