import { KategoriTagihan, StatusPembayaran } from "@prisma/client";
import { z } from "zod";

export const createTagihanLainSchema = z.object({
	muridId: z.string().min(1, "Murid harus dipilih"),
	kelasId: z.string().optional(),
	kategori: z.nativeEnum(KategoriTagihan),
	judul: z.string().min(1, "Judul tagihan harus diisi"),
	jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
	deskripsi: z.string().optional(),
	status: z.nativeEnum(StatusPembayaran).default(StatusPembayaran.BELUM_LUNAS),
});

export type CreateTagihanLainInput = z.infer<typeof createTagihanLainSchema>;

export const updateTagihanLainSchema = z.object({
	id: z.string(),
	judul: z.string().min(1, "Judul tagihan harus diisi").optional(),
	jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0").optional(),
	deskripsi: z.string().optional(),
	status: z.nativeEnum(StatusPembayaran).optional(),
	kelasId: z.string().optional(), // Allow updating class
	// We don't typically allow updating muridId or kategori
});

export type UpdateTagihanLainInput = z.infer<typeof updateTagihanLainSchema>;
