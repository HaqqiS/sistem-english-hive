import dayjs from "dayjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TIMEZONE_BISNIS } from "../../utils/dateUtils";

vi.mock("@/env", () => ({
	env: { AUTH_SECRET: "rahasia-untuk-test", NODE_ENV: "test" },
}));

import {
	buatKodePenggantian,
	formatKodePenggantian,
	verifikasiKodePenggantian,
} from "../../server/services/penggantian-token.service";

const hariIni = () => dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM-DD");
const hariKe = (n: number) =>
	dayjs().tz(TIMEZONE_BISNIS).add(n, "day").format("YYYY-MM-DD");

const dasar = {
	jadwalKelasId: "jadwal-1",
	guruAsliId: "guru-asli",
	guruPenggantiId: "guru-pengganti",
};

const konteks = {
	jadwalKelasId: "jadwal-1",
	guruPenggantiId: "guru-pengganti",
	kandidatGuruAsliIds: ["guru-lain-di-kelas", "guru-asli"],
};

describe("Penggantian Kode Service (kode 8 digit)", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("menghasilkan kode 8 digit angka dan deterministik", () => {
		const a = buatKodePenggantian({ ...dasar, tanggal: hariIni() });
		const b = buatKodePenggantian({ ...dasar, tanggal: hariIni() });

		expect(a.kode).toMatch(/^\d{8}$/);
		expect(a.kode).toBe(b.kode);
		expect(a.kodeFormat).toBe(formatKodePenggantian(a.kode));
		expect(a.kodeFormat).toMatch(/^\d{4} \d{4}$/);
	});

	it("kode valid dan mengenali guru asli yang benar dari beberapa kandidat", () => {
		const { kode } = buatKodePenggantian({ ...dasar, tanggal: hariIni() });
		const hasil = verifikasiKodePenggantian(kode, konteks);

		expect(hasil.guruAsliId).toBe("guru-asli");
		expect(hasil.tanggal).toBe(hariIni());
	});

	it("spasi dan tanda strip pada input diabaikan", () => {
		const { kode } = buatKodePenggantian({ ...dasar, tanggal: hariIni() });
		const spasi = `${kode.slice(0, 4)} ${kode.slice(4)}`;
		const strip = ` ${kode.slice(0, 4)}-${kode.slice(4)} `;

		expect(verifikasiKodePenggantian(spasi, konteks).guruAsliId).toBe(
			"guru-asli",
		);
		expect(verifikasiKodePenggantian(strip, konteks).guruAsliId).toBe(
			"guru-asli",
		);
	});

	it("menolak guru lain yang memakai kode", () => {
		const { kode } = buatKodePenggantian({ ...dasar, tanggal: hariIni() });
		expect(() =>
			verifikasiKodePenggantian(kode, {
				...konteks,
				guruPenggantiId: "guru-lain",
			}),
		).toThrow(/salah/);
	});

	it("menolak kode untuk jadwal yang berbeda", () => {
		const { kode } = buatKodePenggantian({ ...dasar, tanggal: hariIni() });
		expect(() =>
			verifikasiKodePenggantian(kode, {
				...konteks,
				jadwalKelasId: "jadwal-2",
			}),
		).toThrow(/salah/);
	});

	it("menolak jika guru penerbit bukan kandidat (tidak lagi bertugas di kelas)", () => {
		const { kode } = buatKodePenggantian({ ...dasar, tanggal: hariIni() });
		expect(() =>
			verifikasiKodePenggantian(kode, {
				...konteks,
				kandidatGuruAsliIds: ["guru-lain-di-kelas"],
			}),
		).toThrow(/salah/);
	});

	it("menolak kode yang salah angka", () => {
		const { kode } = buatKodePenggantian({ ...dasar, tanggal: hariIni() });
		const salah = String((Number(kode) + 1) % 1e8).padStart(8, "0");
		expect(() => verifikasiKodePenggantian(salah, konteks)).toThrow(/salah/);
	});

	it("menolak format yang bukan 8 digit angka", () => {
		expect(() => verifikasiKodePenggantian("1234", konteks)).toThrow(/8 digit/);
		expect(() => verifikasiKodePenggantian("abcd efgh", konteks)).toThrow(
			/8 digit/,
		);
		expect(() => verifikasiKodePenggantian("123456789", konteks)).toThrow(
			/8 digit/,
		);
	});

	it("kode untuk besok belum bisa dipakai hari ini dan memberi tahu tanggalnya", () => {
		const { kode } = buatKodePenggantian({ ...dasar, tanggal: hariKe(1) });
		expect(() => verifikasiKodePenggantian(kode, konteks)).toThrow(
			new RegExp(`hanya berlaku pada tanggal ${hariKe(1)}`),
		);
	});

	it("kode hari ini tidak berlaku lagi setelah tanggalnya lewat", () => {
		const { kode } = buatKodePenggantian({ ...dasar, tanggal: hariIni() });
		vi.useFakeTimers();
		vi.setSystemTime(dayjs().add(2, "day").toDate());
		expect(() => verifikasiKodePenggantian(kode, konteks)).toThrow(/salah/);
	});

	it("kedaluwarsa = akhir hari tanggal berlaku (WITA)", () => {
		const { kedaluwarsa } = buatKodePenggantian({
			...dasar,
			tanggal: hariKe(1),
		});
		const akhirHari = dayjs
			.tz(hariKe(1), TIMEZONE_BISNIS)
			.endOf("day")
			.valueOf();
		expect(kedaluwarsa.getTime()).toBe(akhirHari);
	});

	it("menolak membuat kode untuk tanggal lampau, terlalu jauh, atau format salah", () => {
		expect(() =>
			buatKodePenggantian({ ...dasar, tanggal: hariKe(-1) }),
		).toThrow(/masa lalu/);
		expect(() => buatKodePenggantian({ ...dasar, tanggal: hariKe(8) })).toThrow(
			/maksimal/,
		);
		expect(() =>
			buatKodePenggantian({ ...dasar, tanggal: "05-10-2026" }),
		).toThrow(/Format tanggal/);
	});
});