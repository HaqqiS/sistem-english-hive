import dayjs from "dayjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TIMEZONE_BISNIS } from "../../utils/dateUtils";

vi.mock("@/env", () => ({
	env: { AUTH_SECRET: "rahasia-untuk-test", NODE_ENV: "test" },
}));

import {
	buatTokenPenggantian,
	verifikasiTokenPenggantian,
} from "../../server/services/penggantian-token.service";

const hariIni = () => dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM-DD");
const hariKe = (n: number) =>
	dayjs().tz(TIMEZONE_BISNIS).add(n, "day").format("YYYY-MM-DD");

const dasar = {
	jadwalKelasId: "jadwal-1",
	guruAsliId: "guru-asli",
	guruPenggantiId: "guru-pengganti",
};

describe("Penggantian Token Service", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("token valid untuk guru pengganti yang tepat di hari yang tepat", () => {
		const { token } = buatTokenPenggantian({ ...dasar, tanggal: hariIni() });
		const payload = verifikasiTokenPenggantian(token, "guru-pengganti");

		expect(payload.jadwalKelasId).toBe("jadwal-1");
		expect(payload.guruAsliId).toBe("guru-asli");
		expect(payload.tanggal).toBe(hariIni());
	});

	it("menerima token yang terbawa spasi/baris baru dari chat", () => {
		const { token } = buatTokenPenggantian({ ...dasar, tanggal: hariIni() });
		const kotor = ` ${token.slice(0, 20)}\n${token.slice(20)} `;
		expect(() =>
			verifikasiTokenPenggantian(kotor, "guru-pengganti"),
		).not.toThrow();
	});

	it("menolak guru lain yang memakai token", () => {
		const { token } = buatTokenPenggantian({ ...dasar, tanggal: hariIni() });
		expect(() => verifikasiTokenPenggantian(token, "guru-lain")).toThrow(
			/guru lain/,
		);
	});

	it("menolak token yang payload-nya diubah (tanda tangan tidak cocok)", () => {
		const { token } = buatTokenPenggantian({ ...dasar, tanggal: hariIni() });
		const [versi, body, sig] = token.split(".") as [string, string, string];
		const rusak = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
		rusak.p = "guru-lain";
		const bodyBaru = Buffer.from(JSON.stringify(rusak)).toString("base64url");

		expect(() =>
			verifikasiTokenPenggantian(`${versi}.${bodyBaru}.${sig}`, "guru-lain"),
		).toThrow(/tidak valid/);
	});

	it("menolak format sembarang", () => {
		expect(() => verifikasiTokenPenggantian("abc", "x")).toThrow(/Format/);
		expect(() => verifikasiTokenPenggantian("EHP1.a.b", "x")).toThrow();
	});

	it("token untuk tanggal besok belum bisa dipakai hari ini", () => {
		const { token } = buatTokenPenggantian({ ...dasar, tanggal: hariKe(1) });
		expect(() => verifikasiTokenPenggantian(token, "guru-pengganti")).toThrow(
			/hanya berlaku pada tanggal/,
		);
	});

	it("token kedaluwarsa setelah tanggalnya lewat", () => {
		const { token } = buatTokenPenggantian({ ...dasar, tanggal: hariIni() });
		vi.useFakeTimers();
		vi.setSystemTime(dayjs().add(2, "day").toDate());
		expect(() => verifikasiTokenPenggantian(token, "guru-pengganti")).toThrow(
			/kedaluwarsa/,
		);
	});

	it("menolak membuat token untuk tanggal lampau atau terlalu jauh", () => {
		expect(() =>
			buatTokenPenggantian({ ...dasar, tanggal: hariKe(-1) }),
		).toThrow(/masa lalu/);
		expect(() =>
			buatTokenPenggantian({ ...dasar, tanggal: hariKe(8) }),
		).toThrow(/maksimal/);
		expect(() =>
			buatTokenPenggantian({ ...dasar, tanggal: "05-10-2026" }),
		).toThrow(/Format tanggal/);
	});
});