import { StatusPembayaran } from "@prisma/client";
import z from "zod";

const basePembayaranSchema = z.object({
	pendaftaranKelasId: z.string(),
	jumlahBayar: z.coerce.number().min(0, "Jumlah bayar tidak boleh negatif"),
	tanggalBayar: z
		.string()
		.optional()
		.refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
			message: "Format tanggal tidak valid (YYYY-MM-DD)",
		}),
	pembayaranKe: z.number().optional(),
	note: z.string().optional(),
});

export const clientCreatePembayaranSchema = basePembayaranSchema;
export type TypeClientCreatePembayaranSchema = z.infer<
	typeof clientCreatePembayaranSchema
>;

export const clientUpdatePembayaranSchema = basePembayaranSchema
	.omit({ pendaftaranKelasId: true })
	.extend({
		id: z.string().cuid(),
		statusBayar: z.nativeEnum(StatusPembayaran),
	});

export type TypeClientUpdatePembayaranSchema = z.infer<
	typeof clientUpdatePembayaranSchema
>;

// 2. Server Schema (API): Transforms string -> Date
export const createPembayaranSchema = clientCreatePembayaranSchema.extend({
	tanggalBayar: z
		.string()
		.optional()
		.transform((val) => (val ? new Date(val) : new Date())),
});

export const updatePembayaranSchema = clientUpdatePembayaranSchema.extend({
	tanggalBayar: z
		.string()
		.optional()
		.transform((val) => (val ? new Date(val) : undefined)),
});

export type TypeUpdatePembayaranSchema = z.infer<typeof updatePembayaranSchema>;
