import type { RouterOutputs } from "@/trpc/react";
import { EnumStatusGuru } from "@prisma/client";
import z from "zod";

export type TypeHistoryGuruKelas =
  RouterOutputs["historyGuruKelas"]["getAll"][number];

export type TypeHistoryGuruKelasByKelasId =
  RouterOutputs["historyGuruKelas"]["getHistoryGuruByKelasId"][number];

const baseHistoryGuruKelas = z.object({
  kelasId: z.string().min(1, "Kelas harus dipilih"),
  guruId: z.string().min(1, "Guru harus dipilih"),
  statusGuru: z.nativeEnum(EnumStatusGuru),
  mulaiPada: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  selesaiPada: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional()
    .nullable(),
});

export const clientHistoryGuruKelasSchema = baseHistoryGuruKelas.omit({});

export const updateHistoryGuruKelasSchema = baseHistoryGuruKelas.omit({
  selesaiPada: true,
  statusGuru: true,
});

export type TypeClientHistoryGuruKelasSchema = z.infer<
  typeof clientHistoryGuruKelasSchema
>;

export type TypeUpdateHistoryGuruKelasSchema = z.infer<
  typeof updateHistoryGuruKelasSchema
>;

export const serverHistoryGuruKelasSchema = baseHistoryGuruKelas;
