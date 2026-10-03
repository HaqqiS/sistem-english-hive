import dayjs from "@/utils/dateUtils";

// Konstanta gaji per sesi
export const GAJI_PER_SESI = 50000;
/** Default rate untuk Guru Asisting — bisa diubah manual per kelas di halaman Gaji Guru. */
export const GAJI_PER_SESI_ASISTING = 30000;

/**
 * Menghitung range tanggal untuk periode gaji (Tgl 26 Bulan Lalu - Tgl 25 Bulan Ini)
 * @param monthStr string format "YYYY-MM" (Bulan gaji yang ingin dibayarkan)
 */
export const getPeriodeGaji = (monthStr: string) => {
	// Asumsikan input adalah bulan pembayarannya (misal: "2025-11")
	const targetMonth = dayjs(monthStr);

	// Start: Tanggal 26 bulan sebelumnya, jam 00:00:00
	const startDate = targetMonth
		.subtract(1, "month")
		.date(26)
		.startOf("day")
		.toDate();

	// End: Tanggal 25 bulan berjalan, jam 23:59:59
	const endDate = targetMonth.date(25).endOf("day").toDate();

	return { startDate, endDate };
};
