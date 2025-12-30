import z from "zod";

const baseSesiPertemuanSchema = z.object({
	kelasId: z.string().min(1, "Kelas Program harus diisi"),
	ruangId: z.string().min(1, "Ruang harus diisi"),
	tanggalWaktu: z.date({
		required_error: "Tanggal dan Waktu harus diisi",
	}),
	// tanggalWaktu: z
	//   .string()
	//   .regex(
	//     /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
	//     "Format tanggal tidak valid",
	//   ),
});

export const clientSesiPertemuanSchema = baseSesiPertemuanSchema;

export type TypeClientSesiPertemuanSchema = z.infer<
	typeof clientSesiPertemuanSchema
>;

export const updateSesiPertemuanSchema = z.object({
	id: z.string().min(1, "ID Sesi harus diisi"),
	tanggalWaktu: z.date({
		required_error: "Tanggal dan Waktu harus diisi",
	}),
});

export const serverSesiPertemuanSchema = baseSesiPertemuanSchema;
