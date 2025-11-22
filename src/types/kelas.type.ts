import type { RouterOutputs } from "@/trpc/react";
import { JenisKelas, TipeKelas } from "@prisma/client";
import z from "zod";

export type TypeKelas = RouterOutputs["kelas"]["getAll"][number];
export type TypeCreateKelas = RouterOutputs["kelas"]["createKelas"];
export type TypeKelasWithSesi =
  RouterOutputs["kelas"]["getKelasWithSesiForGuru"];
export type TypeKelasByGuruId = TypeKelasWithSesi[number];
export type TypeSesiPertemuanShort =
  TypeKelasByGuruId["sesiPertemuanKelases"][number];
export type TypeKelasHistory =
  RouterOutputs["kelas"]["getKelasHistory"][number];

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

export const upLevelKelasSchema = z.object({
  oldKelasId: z.string().cuid(),
  newLevel: z.coerce.number().min(1, "Level baru harus diisi"),
  newBulanTahunAjar: z
    .string()
    .min(7, "Bulan/Tahun Ajar baru harus diisi (MM/YYYY)")
    .max(7),
  newKodeKelas: z.string().min(1, "Kode Kelas baru harus diisi"),
  // Tanggal mulai ini penting untuk mencatat kapan pendaftaran & tagihan baru dimulai
  newTanggalMulai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
});

export type TypeUpLevelKelasSchema = z.infer<typeof upLevelKelasSchema>;
