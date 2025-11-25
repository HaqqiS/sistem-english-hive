import type { RouterOutputs } from "@/trpc/react";
import { StatusPembayaran } from "@prisma/client";
import z from "zod";

export type TypePembayaran = RouterOutputs["pembayaran"]["getAll"][number];
export type TypePembayaranPaginated =
  RouterOutputs["pembayaran"]["getAllPaginated"];
export type TypePembayaranJatuhTempo =
  RouterOutputs["pembayaran"]["getTagihanJatuhTempo"][number];

// 1. Client Schema (Form): Accepts string for dates
export const clientUpdatePembayaranSchema = z.object({
  id: z.string().cuid(),
  statusBayar: z.nativeEnum(StatusPembayaran),
  jumlahBayar: z.coerce.number().min(0, "Jumlah bayar tidak boleh negatif"),
  tanggalBayar: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Format tanggal tidak valid (YYYY-MM-DD)",
    }),
  note: z.string().optional(),
});

export type TypeClientUpdatePembayaranSchema = z.infer<
  typeof clientUpdatePembayaranSchema
>;

// 2. Server Schema (API): Transforms string -> Date
export const updatePembayaranSchema = clientUpdatePembayaranSchema.extend({
  tanggalBayar: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export type TypeUpdatePembayaranSchema = z.infer<typeof updatePembayaranSchema>;
