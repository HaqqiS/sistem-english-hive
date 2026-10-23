import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

/**
 * Blokir absensi guru per jadwal untuk SATU hari (hari ini), lengkap dengan
 * catatan manual dari admin (izin, sakit, dll).
 *
 * Tanpa mengubah schema: disimpan di tabel `VerificationToken` yang sudah ada
 * (bawaan NextAuth) sebagai penyimpanan key-value kecil:
 *   - identifier : "blokir-absen:{YYYY-MM-DD}:{jadwalKelasId}"
 *   - token      : JSON { id, catatan, olehId, olehNama, waktu }
 *   - expires    : akhir hari tersebut (WITA), jadi otomatis tidak berlaku lagi
 *                  besok (dan baris lama diabaikan oleh query).
 */
const PREFIX = "blokir-absen";

export type BlokirAbsensi = {
	catatan: string;
	olehNama: string;
	waktu: string;
};

const tanggalHariIni = () => dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM-DD");

const buatIdentifier = (tanggal: string, jadwalKelasId: string) =>
	`${PREFIX}:${tanggal}:${jadwalKelasId}`;

function parseToken(token: string): BlokirAbsensi | null {
	try {
		const data = JSON.parse(token) as Partial<BlokirAbsensi>;
		if (typeof data.catatan !== "string") return null;
		return {
			catatan: data.catatan,
			olehNama: data.olehNama ?? "Admin",
			waktu: data.waktu ?? "",
		};
	} catch {
		return null;
	}
}

/** Semua blokir yang berlaku hari ini: Map<jadwalKelasId, blokir>. */
export async function getBlokirHariIni(db: PrismaClient) {
	const tanggal = tanggalHariIni();
	const rows = await db.verificationToken.findMany({
		where: {
			identifier: { startsWith: `${PREFIX}:${tanggal}:` },
			expires: { gt: new Date() },
		},
	});

	const map = new Map<string, BlokirAbsensi>();
	for (const row of rows) {
		const blokir = parseToken(row.token);
		if (!blokir) continue;
		map.set(row.identifier.slice(`${PREFIX}:${tanggal}:`.length), blokir);
	}
	return map;
}

/** Blokir hari ini untuk satu jadwal (null kalau tidak diblokir). */
export async function getBlokirJadwal(db: PrismaClient, jadwalKelasId: string) {
	const row = await db.verificationToken.findFirst({
		where: {
			identifier: buatIdentifier(tanggalHariIni(), jadwalKelasId),
			expires: { gt: new Date() },
		},
	});
	return row ? parseToken(row.token) : null;
}

/** Pasang / ubah catatan blokir untuk jadwal ini, berlaku sampai akhir hari ini. */
export async function setBlokirJadwal(
	db: PrismaClient,
	params: {
		jadwalKelasId: string;
		catatan: string;
		olehId: string;
		olehNama: string;
	},
) {
	const identifier = buatIdentifier(tanggalHariIni(), params.jadwalKelasId);
	const berakhir = dayjs().tz(TIMEZONE_BISNIS).endOf("day").toDate();

	// token bersifat unik, jadi "ubah" = hapus lalu buat ulang
	await db.$transaction([
		db.verificationToken.deleteMany({ where: { identifier } }),
		db.verificationToken.create({
			data: {
				identifier,
				token: JSON.stringify({
					id: randomUUID(),
					catatan: params.catatan,
					olehId: params.olehId,
					olehNama: params.olehNama,
					waktu: new Date().toISOString(),
				}),
				expires: berakhir,
			},
		}),
	]);
}

export async function hapusBlokirJadwal(
	db: PrismaClient,
	jadwalKelasId: string,
) {
	await db.verificationToken.deleteMany({
		where: { identifier: buatIdentifier(tanggalHariIni(), jadwalKelasId) },
	});
}
