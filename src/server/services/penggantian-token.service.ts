import { createHmac, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { env } from "@/env";
import { TIMEZONE_BISNIS } from "@/utils/dateUtils";

/**
 * Kode guru pengganti — 8 digit angka, stateless (tanpa tabel database).
 *
 * Kode TIDAK menyimpan data apa pun. Kode adalah hasil HMAC-SHA256 (dipotong
 * jadi 8 digit, seperti TOTP) dari:
 *   jadwal kelas + guru asli + guru pengganti + tanggal (WITA)
 *
 * Saat diverifikasi, server menghitung ulang kode untuk setiap guru yang
 * bertugas di kelas itu (kandidat guru asli) dan mencari yang cocok. Karena
 * jadwal, guru pengganti (dari sesi login), dan tanggal (hari ini) sudah
 * diketahui server, kode tidak perlu membawa informasi tersebut.
 */

const VERSI = "EHP2";
export const PANJANG_KODE_PENGGANTI = 8;
const MAKS_HARI_KE_DEPAN = 7;
const FORMAT_TANGGAL = "YYYY-MM-DD";

const getSecret = (): string => {
	if (env.AUTH_SECRET) return env.AUTH_SECRET;
	if (env.NODE_ENV === "production") {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "AUTH_SECRET belum dikonfigurasi di server.",
		});
	}
	// Hanya untuk development lokal (AUTH_SECRET opsional di luar production)
	return "dev-only-secret-penggantian-guru";
};

const tanggalHariIni = (): string =>
	dayjs().tz(TIMEZONE_BISNIS).format(FORMAT_TANGGAL);

type DataKode = {
	jadwalKelasId: string;
	guruAsliId: string;
	guruPenggantiId: string;
	/** YYYY-MM-DD (WITA) */
	tanggal: string;
};

/** Menghitung kode 8 digit untuk kombinasi data tertentu. */
const hitungKode = (d: DataKode): string => {
	const mac = createHmac("sha256", getSecret())
		.update(
			[VERSI, d.jadwalKelasId, d.guruAsliId, d.guruPenggantiId, d.tanggal].join(
				"|",
			),
		)
		.digest();

	// 6 byte pertama → angka 48-bit, dipotong ke 8 digit (bias modulo diabaikan)
	const angka = mac.readUIntBE(0, 6) % 10 ** PANJANG_KODE_PENGGANTI;
	return angka.toString().padStart(PANJANG_KODE_PENGGANTI, "0");
};

/** "12345678" → "1234 5678" (untuk ditampilkan / dikirim lewat chat). */
export const formatKodePenggantian = (kode: string): string =>
	`${kode.slice(0, 4)} ${kode.slice(4)}`;

/**
 * Membuat kode pengganti. `tanggal` harus hari ini sampai
 * MAKS_HARI_KE_DEPAN hari ke depan (WITA).
 */
export const buatKodePenggantian = (
	input: DataKode,
): { kode: string; kodeFormat: string; kedaluwarsa: Date } => {
	const { tanggal } = input;

	if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Format tanggal harus YYYY-MM-DD.",
		});
	}

	const batasAtas = dayjs()
		.tz(TIMEZONE_BISNIS)
		.add(MAKS_HARI_KE_DEPAN, "day")
		.format(FORMAT_TANGGAL);

	if (tanggal < tanggalHariIni()) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Tanggal penggantian tidak boleh di masa lalu.",
		});
	}
	if (tanggal > batasAtas) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Tanggal penggantian maksimal ${MAKS_HARI_KE_DEPAN} hari ke depan.`,
		});
	}

	const kode = hitungKode(input);

	return {
		kode,
		kodeFormat: formatKodePenggantian(kode),
		kedaluwarsa: dayjs.tz(tanggal, TIMEZONE_BISNIS).endOf("day").toDate(),
	};
};

const samaPersis = (a: string, b: string): boolean => {
	const ba = Buffer.from(a);
	const bb = Buffer.from(b);
	return ba.length === bb.length && timingSafeEqual(ba, bb);
};

/**
 * Memverifikasi kode yang dimasukkan guru pengganti.
 *
 * @param kodeMentah          input guru (spasi/strip diabaikan)
 * @param jadwalKelasId       jadwal yang akan dimulai
 * @param guruPenggantiId     user yang sedang login
 * @param kandidatGuruAsliIds guru yang sedang bertugas (ACTIVE) di kelas itu
 * @returns guru asli yang menerbitkan kode + tanggal berlaku (hari ini)
 *
 * Melempar TRPCError jika format salah, kode tidak cocok, atau kode
 * ternyata untuk tanggal lain.
 */
export const verifikasiKodePenggantian = (
	kodeMentah: string,
	input: {
		jadwalKelasId: string;
		guruPenggantiId: string;
		kandidatGuruAsliIds: string[];
	},
): { guruAsliId: string; tanggal: string } => {
	const kode = kodeMentah.replace(/[\s-]/g, "");

	if (!new RegExp(`^\\d{${PANJANG_KODE_PENGGANTI}}$`).test(kode)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Kode pengganti harus ${PANJANG_KODE_PENGGANTI} digit angka.`,
		});
	}

	const hariIni = tanggalHariIni();

	const cari = (tanggal: string): string | null => {
		let ditemukan: string | null = null;
		// Tidak berhenti di kecocokan pertama supaya waktu proses tetap konstan
		for (const guruAsliId of input.kandidatGuruAsliIds) {
			const harapan = hitungKode({
				jadwalKelasId: input.jadwalKelasId,
				guruAsliId,
				guruPenggantiId: input.guruPenggantiId,
				tanggal,
			});
			if (samaPersis(kode, harapan)) ditemukan = guruAsliId;
		}
		return ditemukan;
	};

	const guruAsliId = cari(hariIni);
	if (guruAsliId) return { guruAsliId, tanggal: hariIni };

	// Bantu pengguna: apakah kode ini ternyata untuk hari lain (maks. 7 hari ke depan)?
	for (let i = 1; i <= MAKS_HARI_KE_DEPAN; i++) {
		const tanggal = dayjs()
			.tz(TIMEZONE_BISNIS)
			.add(i, "day")
			.format(FORMAT_TANGGAL);
		if (cari(tanggal)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Kode ini hanya berlaku pada tanggal ${tanggal}.`,
			});
		}
	}

	throw new TRPCError({
		code: "FORBIDDEN",
		message:
			"Kode pengganti salah, bukan untuk akun/jadwal ini, atau sudah tidak berlaku.",
	});
};
