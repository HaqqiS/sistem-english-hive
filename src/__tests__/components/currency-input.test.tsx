import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CurrencyInput } from "@/components/ui/currency-input";

afterEach(cleanup);

// Wrapper yang meniru pemakaian di form: menyimpan angka murni
function Harness({ initial }: { initial?: number }) {
	const [val, setVal] = useState<number | undefined>(initial);
	return (
		<>
			<CurrencyInput aria-label="nominal" value={val} onValueChange={setVal} />
			<output data-testid="angka">{val === undefined ? "kosong" : val}</output>
		</>
	);
}

const input = () => screen.getByLabelText("nominal") as HTMLInputElement;
const angka = () => screen.getByTestId("angka").textContent;

describe("CurrencyInput", () => {
	it("menambahkan titik ribuan otomatis saat mengetik", () => {
		render(<Harness />);
		fireEvent.change(input(), { target: { value: "1250000" } });
		expect(input().value).toContain("1.250.000");
		expect(angka()).toBe("1250000");
	});

	it("mengirim angka murni (tanpa titik / Rp) ke form", () => {
		render(<Harness />);
		fireEvent.change(input(), { target: { value: "Rp 50.000" } });
		expect(angka()).toBe("50000");
	});

	it("mengabaikan huruf dan simbol selain angka", () => {
		render(<Harness />);
		fireEvent.change(input(), { target: { value: "12ab-3,4" } });
		expect(angka()).toBe("1234");
	});

	it("menampilkan nilai awal dengan titik", () => {
		render(<Harness initial={300000} />);
		expect(input().value).toContain("300.000");
	});

	it("kosong saat semua digit dihapus (undefined, bukan 0)", () => {
		render(<Harness initial={5000} />);
		fireEvent.change(input(), { target: { value: "" } });
		expect(input().value).toBe("");
		expect(angka()).toBe("kosong");
	});

	it("membatasi angka agar tidak melewati batas Int PostgreSQL", () => {
		render(<Harness />);
		fireEvent.change(input(), { target: { value: "99999999999999" } });
		expect(angka()).toBe("2147483647");
	});

	it("menerima nilai string angka dari state string", () => {
		function StringHarness() {
			const [v, setV] = useState("750000");
			return (
				<CurrencyInput
					aria-label="nominal"
					value={v}
					onValueChange={(n) => setV(n === undefined ? "" : String(n))}
				/>
			);
		}
		render(<StringHarness />);
		expect(input().value).toContain("750.000");
		fireEvent.change(input(), { target: { value: "1000000" } });
		expect(input().value).toContain("1.000.000");
	});
});
