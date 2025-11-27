import type { RouterOutputs } from "@/trpc/react";
import z from "zod";

export type SesiPertemuanType =
  RouterOutputs["sesiPertemuan"]["getAll"][number];

export type TypeSesiSummary =
  RouterOutputs["sesiPertemuan"]["getSesiSummaryByKelasId"];

export type TypeSesiSummaryColumnData = TypeSesiSummary["columnData"][number];

export type TypeSesiSummaryRowData = TypeSesiSummary["rowData"][number];

const baseSesiPertemuanSchema = z.object({
  kelasId: z.string().min(1, "Kelas Program harus diisi"),
  ruangId: z.string().min(1, "Ruang harus diisi"),
  tanggalWaktu: z.date({
    required_error: "Tanggal dan Waktu harus diisi",
  }), // tanggalWaktu: z
  //   .string()
  //   .regex(
  //     /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  //     "Format tanggal tidak valid",
  //   ),
});

export const clientSesiPertemuanSchema = baseSesiPertemuanSchema;

export type TypeClientSesiPertemuanSchema = z.infer<
  typeof clientSesiPertemuanSchema
>;

export const serverSesiPertemuanSchema = baseSesiPertemuanSchema;
