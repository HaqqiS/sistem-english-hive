import type { RouterOutputs } from "@/trpc/react";
import z from "zod";
export type PendaftaranKelasType =
  RouterOutputs["pendaftaranKelas"]["getAll"][number];

const basePendaftaranKelasSchema = z.object({
  muridId: z.string().min(1, "Murid harus dipilih"),
  kelasId: z.string().min(1, "Program Kelas harus dipilih"),
  tanggalMulai: z
    .string({ required_error: "Tanggal mulai harus diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  isAktif: z.boolean().default(true),
});

export const clientPendaftaranKelasSchema = basePendaftaranKelasSchema.omit({
  isAktif: true,
});

export type TypeClientPendaftaranKelasSchema = z.infer<
  typeof clientPendaftaranKelasSchema
>;

export const serverPendaftaranKelasSchema = basePendaftaranKelasSchema
  .omit({ tanggalMulai: true })
  .extend({
    tanggalMulai: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  });
