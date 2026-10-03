import { createHmac, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { env } from "@/env";
import { TIMEZONE_BISNIS } from "@/utils/dateUtils";

/**
 * Kode (token) guru pengganti — stateless, tanpa tabel database.
 *
 * Format: EHP1.<payload base64url>.<tanda tangan HMAC-SHA256 base64url>
 *
 * Token terikat ke: satu jadwal kelas, satu guru asli, satu guru pengganti,
 * dan satu tanggal (WITA). Kedaluwarsa otomatis di akhir tanggal tersebut.
 */

const VERSI = "EHP1";
const MAKS_HARI_KE_DEPAN = 7;
const FORMAT_TANGGAL = "YYYY-MM-DD";

export type PayloadPenggantian = {
	jadwalKelasId: string;
	guruAsliId: string;
	guruPenggantiId: string;
	/** Tanggal berlaku, format YYYY-MM-DD (WITA) */
	tanggal: string;
	/** Waktu kedaluwarsa (epoch ms) */
	exp: number;
};

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

const tandatangani = (body: string): string =>
	createHmac("sha256", getSecret())
		.update(`${VERSI}.${body}`)
		.digest("base64url");

const tanggalHariIni = (): string =>
	dayjs().tz(TIMEZONE_BISNIS).format(FORMAT_TANGGAL);

/**
 * Membuat token pengganti. `tanggal` harus hari ini sampai
 * MAKS_HARI_KE_DEPAN hari ke depan (WITA).
 */
export const buatTokenPenggantian = (input: {
	jadwalKelasId: string;
	guruAsliId: string;
	guruPenggantiId: string;
	tanggal: string;
}): { token: string; kedaluwarsa: Date } => {
	const { jadwalKelasId, guruAsliId, guruPenggantiId, tanggal } = input;

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

	const exp = dayjs.tz(tanggal, TIMEZONE_BISNIS).endOf("day").valueOf();

	// Key dipendekkan supaya token tidak terlalu panjang saat dikirim lewat chat
	const body = Buffer.from(
		JSON.stringify({
			j: jadwalKelasId,
			a: guruAsliId,
			p: guruPenggantiId,
			t: tanggal,
			e: exp,
		}),
	).toString("base64url");

	return {
		token: `${VERSI}.${body}.${tandatangani(body)}`,
		kedaluwarsa: new Date(exp),
	};
};

/**
 * Memverifikasi token. Melempar TRPCError jika tidak valid, bukan milik
 * `guruPenggantiId`, sudah kedaluwarsa, atau bukan untuk tanggal hari ini.
 */
export const verifikasiTokenPenggantian = (
	tokenMentah: string,
	guruPenggantiId: string,
): PayloadPenggantian => {
	// Token sering ikut membawa spasi/baris baru saat di-copy dari chat
	const token = tokenMentah.replace(/\s+/g, "");
	const bagian = token.split(".");

	if (bagian.length !== 3 || bagian[0] !== VERSI) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Format kode pengganti tidak valid.",
		});
	}

	const body = bagian[1] as string;
	const tandaTangan = Buffer.from(bagian[2] as string);
	const diharapkan = Buffer.from(tandatangani(body));

	if (
		tandaTangan.length !== diharapkan.length ||
		!timingSafeEqual(tandaTangan, diharapkan)
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Kode pengganti tidak valid.",
		});
	}

	let mentah: unknown;
	try {
		mentah = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
	} catch {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Isi kode pengganti rusak.",
		});
	}

	const p = mentah as Record<string, unknown>;
	if (
		typeof p.j !== "string" ||
		typeof p.a !== "string" ||
		typeof p.p !== "string" ||
		typeof p.t !== "string" ||
		typeof p.e !== "number"
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Isi kode pengganti rusak.",
		});
	}

	const payload: PayloadPenggantian = {
		jadwalKelasId: p.j,
		guruAsliId: p.a,
		guruPenggantiId: p.p,
		tanggal: p.t,
		exp: p.e,
	};

	if (payload.guruPenggantiId !== guruPenggantiId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Kode ini diterbitkan untuk guru lain.",
		});
	}

	if (Date.now() > payload.exp) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Kode pengganti sudah kedaluwarsa.",
		});
	}

	if (payload.tanggal !== tanggalHariIni()) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Kode ini hanya berlaku pada tanggal ${payload.tanggal}.`,
		});
	}

	return payload;
};