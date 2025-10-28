import type { RouterOutputs } from "@/trpc/react";
import z from "zod";

export type CabangType = RouterOutputs["cabang"]["getAll"][number];

const baseCabangSchema = z.object({
  nama: z.string().min(1, "Nama harus diisi").max(100),
  alamat: z.string().min(1, "Alamat harus diisi").max(255),
  noTelp: z
    .string()
    .min(1, "No Telepon harus diisi")
    .max(15, "No Telepon maksimal 15 karakter")
    .regex(/^\+?[0-9]*$/, { message: "No Telepon tidak valid" }),
});

export const clientCabangSchema = baseCabangSchema.extend({});

export type TypeClientCabangSchema = z.infer<typeof clientCabangSchema>;

export const serverCabangSchema = baseCabangSchema;
