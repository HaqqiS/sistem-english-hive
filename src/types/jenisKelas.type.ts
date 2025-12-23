import { TipeKelas } from "@prisma/client";
import { z } from "zod";

export const jenisKelasSchema = z.object({
	id: z.string().optional(),
	nama: z.string().min(1, "Nama jenis kelas wajib diisi"),
	tipe: z.nativeEnum(TipeKelas),
	harga: z.number().min(0, "Harga tidak boleh negatif"),
	deskripsi: z.string().nullable().optional(),
	nextLevelId: z.string().nullable().optional(),
});

export type TypeJenisKelas = z.infer<typeof jenisKelasSchema>;
