import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { TanggalLahirPicker } from "@/app/_components/shared/TanggalLahirPicker";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

afterEach(cleanup);

function Harness({
	initial = "",
	lang,
}: {
	initial?: string;
	lang?: "id" | "en";
}) {
	const [v, setV] = useState(initial);
	return (
		<>
			<TanggalLahirPicker value={v} onChange={setV} lang={lang} />
			<output data-testid="nilai">{v || "kosong"}</output>
		</>
	);
}

const nilai = () => screen.getByTestId("nilai").textContent;
const buka = () => fireEvent.click(screen.getByRole("button"));
const kolom = (nama: string) =>
	within(screen.getByRole("listbox", { name: nama }));
const pilih = (nama: string, opsi: string) =>
	fireEvent.click(kolom(nama).getByRole("option", { name: opsi }));

describe("TanggalLahirPicker", () => {
	it("menampilkan placeholder jika kosong", () => {
		render(<Harness />);
		expect(screen.getByRole("button").textContent).toContain(
			"Pilih tanggal lahir",
		);
	});

	it("menampilkan tanggal dengan nama bulan Indonesia", () => {
		render(<Harness initial="2016-03-15" />);
		expect(screen.getByRole("button").textContent).toContain("15 Maret 2016");
	});

	it("memilih hari, bulan, tahun lalu 'Pilih' menghasilkan YYYY-MM-DD", () => {
		render(<Harness />);
		buka();
		pilih("Tanggal", "5");
		pilih("Bulan", "Maret");
		pilih("Tahun", "2016");
		fireEvent.click(screen.getByRole("button", { name: "Pilih" }));
		expect(nilai()).toBe("2016-03-05");
	});

	it("tombol 'Pilih' nonaktif sebelum ketiganya dipilih", () => {
		render(<Harness />);
		buka();
		pilih("Tanggal", "5");
		pilih("Bulan", "Maret");
		const tombol = screen.getByRole("button", {
			name: "Pilih",
		}) as HTMLButtonElement;
		expect(tombol.disabled).toBe(true);
	});

	it("hari tidak valid direset saat bulan diganti (31 -> Februari)", () => {
		render(<Harness />);
		buka();
		pilih("Tanggal", "31");
		pilih("Tahun", "2016");
		pilih("Bulan", "Februari");
		// 31 Februari tidak ada: pilihan hari dikosongkan, 'Pilih' nonaktif
		const tombol = screen.getByRole("button", {
			name: "Pilih",
		}) as HTMLButtonElement;
		expect(tombol.disabled).toBe(true);
		expect(kolom("Tanggal").queryByRole("option", { name: "30" })).toBeNull();
		expect(kolom("Tanggal").getByRole("option", { name: "29" })).toBeTruthy(); // 2016 kabisat
	});

	it("Februari tahun biasa hanya sampai tanggal 28", () => {
		render(<Harness />);
		buka();
		pilih("Tahun", "2015");
		pilih("Bulan", "Februari");
		expect(kolom("Tanggal").queryByRole("option", { name: "29" })).toBeNull();
		expect(kolom("Tanggal").getByRole("option", { name: "28" })).toBeTruthy();
	});

	it("tidak bisa memilih bulan di masa depan pada tahun ini", () => {
		const now = dayjs().tz(TIMEZONE_BISNIS);
		if (now.month() === 11) return; // Desember: tidak ada bulan depan di tahun ini
		render(<Harness />);
		buka();
		pilih("Tahun", String(now.year()));
		const bulanDepan = [
			"Januari",
			"Februari",
			"Maret",
			"April",
			"Mei",
			"Juni",
			"Juli",
			"Agustus",
			"September",
			"Oktober",
			"November",
			"Desember",
		][now.month() + 1] as string;
		const opsi = kolom("Bulan").getByRole("option", {
			name: bulanDepan,
		}) as HTMLButtonElement;
		expect(opsi.disabled).toBe(true);
	});

	it("menampilkan usia sebagai petunjuk", () => {
		render(<Harness />);
		buka();
		const tahunLalu = dayjs().tz(TIMEZONE_BISNIS).year() - 10;
		pilih("Tanggal", "1");
		pilih("Bulan", "Januari");
		pilih("Tahun", String(tahunLalu));
		expect(screen.getByText(/Usia 10 tahun/)).toBeTruthy();
	});

	it("label dan nama bulan berbahasa Inggris saat lang='en'", () => {
		render(<Harness lang="en" initial="2016-03-15" />);
		expect(screen.getByRole("button").textContent).toContain("15 March 2016");
		buka();
		expect(screen.getByRole("listbox", { name: "Day" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Select" })).toBeTruthy();
	});

	it("membuka dengan nilai yang sudah ada dan menandainya terpilih", () => {
		render(<Harness initial="2016-03-15" />);
		buka();
		const hari = kolom("Tanggal").getByRole("option", { name: "15" });
		expect(hari.getAttribute("aria-selected")).toBe("true");
	});

	it("event scroll mouse tidak diteruskan ke penghalang scroll dialog", () => {
		render(<Harness />);
		buka();
		let sampaiKeDocument = false;
		const pantau = () => {
			sampaiKeDocument = true;
		};
		document.addEventListener("wheel", pantau);
		try {
			fireEvent.wheel(screen.getByRole("listbox", { name: "Tahun" }), {
				deltaY: 100,
			});
		} finally {
			document.removeEventListener("wheel", pantau);
		}
		expect(sampaiKeDocument).toBe(false);
	});
});