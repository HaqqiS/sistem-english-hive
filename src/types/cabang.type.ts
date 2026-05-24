import z from "zod";
import type { RouterOutputs } from "@/trpc/react";

export type CabangType = RouterOutputs["cabang"]["getAll"][number];

const baseCabangSchema = z.object({
	namaCabang: z.string().trim().min(1, "Nama cabang harus diisi").max(100),
	alamat: z.string().min(1, "Alamat harus diisi").max(255),
	noTelp: z
		.string()
		.min(1, "No Telepon harus diisi")
		.max(15, "No Telepon maksimal 15 karakter")
		.regex(/^\+?[0-9]*$/, { message: "No Telepon tidak valid" }),
	email: z
		.string()
		.email("Format email tidak valid")
		.optional()
		.or(z.literal("")),
	noRekening: z
		.string()
		.regex(/^\+?[0-9]*$/, { message: "No Rekening tidak valid" })
		.optional(),
	bank: z.string().optional(),
	atasNama: z.string().optional(),
});

export const clientCabangSchema = baseCabangSchema.extend({});

export type TypeClientCabangSchema = z.infer<typeof clientCabangSchema>;

export const serverCabangSchema = baseCabangSchema;