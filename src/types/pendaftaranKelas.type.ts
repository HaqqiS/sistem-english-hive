import { StatusPendaftaran } from "@prisma/client";
import z from "zod";
import type { RouterOutputs } from "@/trpc/react";

export type PendaftaranKelasType =
	RouterOutputs["pendaftaranKelas"]["getPendaftarByKelasId"][number];

const basePendaftaranKelasSchema = z.object({
	muridId: z.string().min(1, "Murid harus dipilih"),
	kelasId: z.string().min(1, "Kelas harus dipilih"),
	status: z.nativeEnum(StatusPendaftaran).default(StatusPendaftaran.AKTIF),
	tanggalMulai: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
		.optional()
		.nullable(),
});

export const clientPendaftaranKelasSchema =
	basePendaftaranKelasSchema.superRefine((data, ctx) => {
		if (data.status === StatusPendaftaran.AKTIF && !data.tanggalMulai) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Tanggal mulai harus diisi untuk status AKTIF",
				path: ["tanggalMulai"],
			});
		}
	});

export type TypeClientPendaftaranKelasSchema = z.infer<
	typeof clientPendaftaranKelasSchema
>;

export const clientTambahMuridSchema = clientPendaftaranKelasSchema;

export type TypeClientTambahMuridSchema = z.infer<
	typeof clientTambahMuridSchema
>;

export const clientUpdatePendaftaranKelasSchema = basePendaftaranKelasSchema
	.extend({
		status: z.nativeEnum(StatusPendaftaran),
	})
	.superRefine((data, ctx) => {
		if (data.status === StatusPendaftaran.AKTIF && !data.tanggalMulai) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Tanggal mulai harus diisi untuk status AKTIF",
				path: ["tanggalMulai"],
			});
		}
	});

export type TypeClientUpdatePendaftaranKelasSchema = z.infer<
	typeof clientUpdatePendaftaranKelasSchema
>;

export const serverPendaftaranKelasSchema = basePendaftaranKelasSchema;

export const serverUpdatePendaftaranKelasSchema =
	basePendaftaranKelasSchema.extend({
		id: z.string().cuid(),
	});

export const clientBulkPendaftaranKelasSchema = z
	.object({
		muridIds: z
			.array(z.string())
			.min(1, "Pilih minimal 1 murid")
			.max(10, "Maksimal 10 murid sekaligus"),
		kelasId: z.string().min(1, "Kelas harus dipilih"),
		status: z.nativeEnum(StatusPendaftaran).default(StatusPendaftaran.AKTIF),
		tanggalMulai: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
			.optional()
			.nullable(),
	})
	.superRefine((data, ctx) => {
		if (data.status === StatusPendaftaran.AKTIF && !data.tanggalMulai) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Tanggal mulai harus diisi untuk status AKTIF",
				path: ["tanggalMulai"],
			});
		}
	});

export type TypeClientBulkPendaftaranKelasSchema = z.infer<
	typeof clientBulkPendaftaranKelasSchema
>;

export const serverBulkPendaftaranKelasSchema =
	clientBulkPendaftaranKelasSchema;

export const clientBulkUpdateStatusSchema = z
	.object({
		pendaftaranIds: z.array(z.string()).min(1, "Pilih minimal 1 siswa"),
		status: z.nativeEnum(StatusPendaftaran),
		tanggalMulai: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
			.optional()
			.nullable(),
	})
	.superRefine((data, ctx) => {
		if (data.status === StatusPendaftaran.AKTIF && !data.tanggalMulai) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Tanggal mulai harus diisi untuk status AKTIF",
				path: ["tanggalMulai"],
			});
		}
	});

export type TypeClientBulkUpdateStatusSchema = z.infer<
	typeof clientBulkUpdateStatusSchema
>;
