/**
 * File konfigurasi terpusat untuk Dayjs dan semua helper tanggal.
 * Impor 'dayjs' dan fungsi helper dari file ini di seluruh aplikasi Anda.
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id"; // impor locale indonesia

// Muat plugin HANYA SEKALI di sini
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

// -----------------------------------------------------------------------------
// KONSTANTA YANG DI-EKSPOR
// -----------------------------------------------------------------------------

/** Zona waktu resmi bisnis (WITA, UTC+8) */
export const TIMEZONE_BISNIS = "Asia/Makassar";

/** Daftar jam mulai kelas yang sudah ditentukan */
export const JAM_MULAI_KELAS = ["14:30", "16:00", "17:30"];

// -----------------------------------------------------------------------------
// FUNGSI HELPER YANG DI-EKSPOR
// -----------------------------------------------------------------------------

/**
 * --- FUNGSI BARU ANDA ---
 * Mengonversi Date object (UTC dari DB) atau string ISO
 * ke string format WITA yang mudah dibaca.
 *
 * @param date - Date object atau string ISO
 * @param format - Opsional: format string (default: "D MMM YYYY, HH:mm")
 * @returns String yang sudah diformat (e.g., "5 Nov 2025, 16:00")
 */
export const formatToWITA = (
  date: Date | string | undefined | null,
  format = "D MMM YYYY, HH:mm",
) => {
  if (!date) return "-"; // Kembalikan placeholder jika tanggal tidak ada
  return dayjs(date).tz(TIMEZONE_BISNIS).format(format);
};

/**
 * --- HELPER BARU UNTUK TANGGALMULAI ---
 * Mengonversi string "YYYY-MM-DD" atau Date object
 * ke string format tanggal WITA yang mudah dibaca (tanpa jam).
 *
 * @param date - Date object atau string "YYYY-MM-DD"
 * @returns String yang sudah diformat (e.g., "5 November 2025")
 */
export const formatDateWITA = (date: Date | string | undefined | null) => {
  if (!date) return "-";
  // 'dayjs(date)' akan menangani string "YYYY-MM-DD" dengan benar
  // Kita tidak perlu .tz() karena kita tidak peduli pergeseran jam
  // tapi kita pakai untuk konsistensi jika inputnya Date object
  return dayjs(date).tz(TIMEZONE_BISNIS).format("D MMMM YYYY");
};

/**
 * Mengonversi input tanggal dan waktu lokal (WITA)
 * menjadi Date object (UTC) yang siap disimpan ke database.
 * Ini adalah inti dari "Langkah 3 (Konversi)"
 *
 * @param localDateTimeString - String tanggal/waktu dalam format WITA (e.g., "2025-11-05T16:00:00")
 * @returns Date object (UTC)
 */
export const convertWITAtoUTC = (localDateTimeString: string): Date => {
  return dayjs.tz(localDateTimeString, TIMEZONE_BISNIS).toDate();
};

/**
 * Pengecekan sederhana untuk validitas Date object
 * (Diambil dari file dateUtils lama Anda)
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * --- HELPER BARU ---
 * Mengonversi Date object dari kalender (atau string)
 * menjadi string "YYYY-MM-DD" yang aman untuk DB.
 *
 * @param date - Date object atau string
 * @returns String "YYYY-MM-DD"
 */
export const formatDateToYYYYMMDD = (date: Date | string): string => {
  // Gunakan dayjs untuk memformat, tidak perlu .tz()
  // karena kita hanya ingin tanggal "lokal" dari kalender
  return dayjs(date).format("YYYY-MM-DD");
};

/**
 * Helper untuk menambahkan leading zero
 * (Diambil dari file dateUtils lama Anda)
 */
export const standardDate = (time: number) =>
  time < 10 ? `0${time}` : `${time}`;

// Ekspor 'dayjs' yang sudah dikonfigurasi jika Anda membutuhkannya secara langsung
export default dayjs;
