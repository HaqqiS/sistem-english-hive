import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DatePickerString } from "@/app/_components/shared/DatePickerString";
import { MonthPickerString } from "@/app/_components/shared/MonthPickerString";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

afterEach(cleanup);

function DateHarness({ initial = "" }: { initial?: string }) {
	const [v, setV] = useState(initial);
	return (
		<>
			<DatePickerString id="tgl" value={v} onChange={setV} disableFuture />
			<output data-testid="nilai">{v || "kosong"}</output>
		</>
	);
}

const nilai = () => screen.getByTestId("nilai").textContent;

describe("DatePickerString", () => {
	it("menampilkan placeholder jika belum ada tanggal", () => {
		render(<DateHarness />);
		expect(screen.getByRole("button").textContent).toContain("Pilih tanggal");
	});

	it("menampilkan tanggal dalam format Indonesia", () => {
		render(<DateHarness initial="2026-11-21" />);
		expect(screen.getByRole("button").textContent).toContain(
			"21 November 2026",
		);
	});

	it("pintasan 'Hari ini' mengisi tanggal hari ini (WITA)", () => {
		render(<DateHarness />);
		fireEvent.click(screen.getByRole("button", { name: /pilih tanggal/i }));
		fireEvent.click(screen.getByRole("button", { name: "Hari ini" }));
		expect(nilai()).toBe(dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM-DD"));
	});

	it("pintasan 'Kemarin' mengisi tanggal kemarin (WITA)", () => {
		render(<DateHarness />);
		fireEvent.click(screen.getByRole("button", { name: /pilih tanggal/i }));
		fireEvent.click(screen.getByRole("button", { name: "Kemarin" }));
		expect(nilai()).toBe(
			dayjs().tz(TIMEZONE_BISNIS).subtract(1, "day").format("YYYY-MM-DD"),
		);
	});
});

function MonthHarness({ initial }: { initial: string }) {
	const [v, setV] = useState(initial);
	return (
		<>
			<MonthPickerString value={v} onChange={setV} />
			<output data-testid="bulan">{v}</output>
		</>
	);
}

describe("MonthPickerString", () => {
	it("menampilkan nama bulan Indonesia", () => {
		render(<MonthHarness initial="2026-03" />);
		expect(
			screen.getByRole("button", { name: "Pilih bulan" }).textContent,
		).toContain("Maret 2026");
	});

	it("memilih bulan dari grid menghasilkan format YYYY-MM", () => {
		render(<MonthHarness initial="2026-03" />);
		fireEvent.click(screen.getByRole("button", { name: "Pilih bulan" }));
		fireEvent.click(screen.getByRole("button", { name: "Jan" }));
		expect(screen.getByTestId("bulan").textContent).toBe("2026-01");
	});

	it("tidak bisa memilih bulan di masa depan", () => {
		const depan = dayjs().tz(TIMEZONE_BISNIS).add(1, "year").format("YYYY-MM");
		render(<MonthHarness initial={depan} />);
		// tahun tampil = tahun depan: semua bulan harus nonaktif
		fireEvent.click(screen.getByRole("button", { name: "Pilih bulan" }));
		expect(
			(screen.getByRole("button", { name: "Jan" }) as HTMLButtonElement)
				.disabled,
		).toBe(true);
	});
});