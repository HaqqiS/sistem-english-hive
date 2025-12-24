import { KategoriTagihan, StatusPembayaran } from "@prisma/client";
import { z } from "zod";
import type { RouterOutputs } from "@/trpc/react";

// --- Zod Schemas ---

export const createTagihanLainSchema = z.object({
	muridId: z.string().min(1, "Murid harus dipilih"),
	kategori: z.nativeEnum(KategoriTagihan),
	judul: z.string().min(1, "Judul tagihan harus diisi"),
	jumlah: z.number().min(0, "Jumlah tidak boleh minus"),
	deskripsi: z.string().optional(),
	status: z.nativeEnum(StatusPembayaran).default("BELUM_LUNAS"),
});

export const updateTagihanLainSchema = z.object({
	id: z.string().min(1, "ID Tagihan wajib ada"),
	judul: z.string().min(1, "Judul tagihan harus diisi").optional(),
	jumlah: z.number().min(0, "Jumlah tidak boleh minus").optional(),
	deskripsi: z.string().optional(),
	status: z.nativeEnum(StatusPembayaran).optional(),
});

// --- Types ---

export type TypeCreateTagihanLainSchema = z.infer<
	typeof createTagihanLainSchema
>;
export type TypeUpdateTagihanLainSchema = z.infer<
	typeof updateTagihanLainSchema
>;

// Inferred from TRPC Router Output
export type TypeTagihanLain =
	RouterOutputs["tagihanLain"]["getAllByMurid"][number];

export type TypeTagihanLainPaginated =
	RouterOutputs["tagihanLain"]["getAllPaginated"];
