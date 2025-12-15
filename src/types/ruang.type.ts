import z from "zod";
import type { RouterOutputs } from "@/trpc/react";

export type RuangType = RouterOutputs["ruang"]["getAll"][number];

const baseRuangSchema = z.object({
	namaRuang: z.string().min(1, "Nama Ruang harus diisi").max(100),
	cabangId: z.string().min(1, "Cabang ID harus diisi"),
	isAktif: z.coerce.boolean(),
});

export const clientRuangSchema = baseRuangSchema.extend({});

export type TypeClientRuangSchema = z.infer<typeof clientRuangSchema>;

export const serverRuangSchema = baseRuangSchema;
