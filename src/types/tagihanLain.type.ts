import { KategoriTagihan, MetodeBayar, StatusPembayaran } from "@prisma/client";
import { z } from "zod";
import { diskonSchema } from "./pembayaran.schema";

export const createTagihanLainSchema = z.object({
	muridId: z.string().min(1, "Murid harus dipilih"),
	kelasId: z.string().optional(),
	kategori: z.nativeEnum(KategoriTagihan),
	judul: z.string().min(1, "Judul tagihan harus diisi"),
	jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
	deskripsi: z.string().optional(),
	status: z.nativeEnum(StatusPembayaran).default(StatusPembayaran.BELUM_LUNAS),
	// Hanya relevan jika tagihan langsung dibuat berstatus LUNAS
	metodeBayar: z.nativeEnum(MetodeBayar).optional(),
	diskon: diskonSchema.optional(),
});

export type CreateTagihanLainInput = z.infer<typeof createTagihanLainSchema>;

export const updateTagihanLainSchema = z.object({
	id: z.string(),
	judul: z.string().min(1, "Judul tagihan harus diisi").optional(),
	jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0").optional(),
	deskripsi: z.string().nullish(),
	status: z.nativeEnum(StatusPembayaran).optional(),
	kelasId: z.string().optional(), // Allow updating class
	// We don't typically allow updating muridId or kategori
});

export type UpdateTagihanLainInput = z.infer<typeof updateTagihanLainSchema>;

/** Input pelunasan Tagihan Lain (Buku / Registrasi). */
export const markAsPaidSchema = z.object({
	id: z.string(),
	metodeBayar: z.nativeEnum(MetodeBayar, {
		required_error: "Metode pembayaran harus dipilih",
	}),
	// YYYY-MM-DD. Kosong = hari ini.
	tanggalBayar: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)")
		.optional(),
	diskon: diskonSchema.default(0),
});

export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>;
