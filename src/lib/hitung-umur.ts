import dayjs from "@/utils/dateUtils";

export type HasilUmur = {
	/** Umur dalam tahun, null jika tidak ada data sama sekali. */
	umur: number | null;
	/** true jika umur hanya perkiraan dari data lama (tanggal lahir belum diisi). */
	estimasi: boolean;
};

/**
 * Hitung umur murid.
 * - Jika tanggalLahir ada: umur dihitung persis dan selalu terbarui.
 * - Jika belum (data lama): pakai umur lama + selisih tahun sejak pendaftaran
 *   (createdAt) sebagai perkiraan. Hasilnya bisa meleset sampai 1 tahun, jadi
 *   ditandai estimasi = true.
 */
export function hitungUmur(
	tanggalLahir?: Date | string | null,
	umurLama?: number | null,
	createdAt?: Date | string | null,
): HasilUmur {
	if (tanggalLahir) {
		return {
			umur: Math.max(0, dayjs().diff(dayjs(tanggalLahir), "year")),
			estimasi: false,
		};
	}

	if (umurLama == null) return { umur: null, estimasi: false };

	const tambahan = createdAt ? dayjs().diff(dayjs(createdAt), "year") : 0;
	return { umur: umurLama + Math.max(0, tambahan), estimasi: true };
}

/** Teks siap tampil, mis. "10", "±10" (perkiraan), atau "-" (tidak ada data). */
export function labelUmur(
	tanggalLahir?: Date | string | null,
	umurLama?: number | null,
	createdAt?: Date | string | null,
): string {
	const { umur, estimasi } = hitungUmur(tanggalLahir, umurLama, createdAt);
	if (umur == null) return "-";
	return estimasi ? `±${umur}` : String(umur);
}

/** Seperti labelUmur tapi dengan satuan, mis. "10 Tahun", "±10 Tahun", atau "-". */
export function labelUmurTahun(
	tanggalLahir?: Date | string | null,
	umurLama?: number | null,
	createdAt?: Date | string | null,
	satuan = "Tahun",
): string {
	const label = labelUmur(tanggalLahir, umurLama, createdAt);
	return label === "-" ? "-" : `${label} ${satuan}`;
}

/**
 * Ubah nilai tanggal (Date / string ISO) menjadi "YYYY-MM-DD" untuk
 * <input type="date"> dan export. Kolom tanggalLahir bertipe DATE (UTC),
 * jadi dipotong dari ISO string agar tidak mundur sehari karena timezone.
 */
export function formatTanggalLahirInput(value: unknown): string {
	if (!value) return "";
	if (typeof value === "string") return value.slice(0, 10);
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10);
	}
	return "";
}
