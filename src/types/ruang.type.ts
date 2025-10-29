import type { RouterOutputs } from "@/trpc/react";
import z from "zod";

export type RuangType = RouterOutputs["ruang"]["getRuangByCabangId"][number];

const baseRuangSchema = z.object({
  namaRuang: z.string().min(1, "Nama Ruang harus diisi").max(100),
  cabangId: z.string().min(1, "Cabang ID harus diisi"),
  kodeRuang: z.string().min(1, "Kode Ruang harus diisi").max(50),
  isAktif: z.boolean().default(true),
});

export const clientRuangSchema = baseRuangSchema.extend({});

export type TypeClientRuangSchema = z.infer<typeof clientRuangSchema>;

export const serverRuangSchema = baseRuangSchema;
