import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import RegistrationChart from "@/app/_components/views/admin/dashboard/registration-chart";

const state = vi.hoisted(() => ({
	trend: { data: undefined as unknown, isLoading: false },
	isMobile: false,
	inputs: [] as unknown[],
}));

vi.mock("@/trpc/react", () => ({
	api: {
		dashboard: {
			getRegistrationTrend: {
				useQuery: (input: unknown) => {
					state.inputs.push(input);
					return state.trend;
				},
			},
		},
	},
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => state.isMobile }));
vi.mock("@/store/useGlobalCabangStore", () => ({
	useGlobalCabangStore: () => ({ activeCabangId: "ALL" }),
}));

beforeAll(() => {
	// recharts (ResponsiveContainer) membutuhkan ResizeObserver, tidak ada di jsdom
	globalThis.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
});

beforeEach(() => {
	state.trend = { isLoading: false, data: [] };
	state.isMobile = false;
	state.inputs = [];
});
afterEach(cleanup);

const bulanTerakhir = () =>
	(state.inputs.at(-1) as { jumlahBulan: number }).jumlahBulan;

describe("RegistrationChart: ringkasan", () => {
	it("menjumlahkan pendaftar & aktif lalu menghitung konversi", () => {
		state.trend = {
			isLoading: false,
			data: [
				{ name: "Jun 2026", pendaftar: 10, aktif: 6 },
				{ name: "Jul 2026", pendaftar: 20, aktif: 9 },
				{ name: "Agu 2026", pendaftar: 10, aktif: 5 },
			],
		};
		render(<RegistrationChart />);
		expect(screen.getByText("Total Pendaftar").nextSibling?.textContent).toBe(
			"40",
		);
		expect(
			screen.getByText("Menjadi Aktif", { selector: "div" }).nextSibling
				?.textContent,
		).toBe("20");
		expect(screen.getByText("50%")).toBeTruthy(); // 20 / 40
	});

	it("konversi 0% (bukan NaN) saat belum ada pendaftar", () => {
		state.trend = {
			isLoading: false,
			data: [{ name: "Jun 2026", pendaftar: 0, aktif: 0 }],
		};
		render(<RegistrationChart />);
		expect(screen.getByText("0%")).toBeTruthy();
	});

	it("tidak menampilkan ringkasan saat masih memuat", () => {
		state.trend = { isLoading: true, data: undefined };
		render(<RegistrationChart />);
		expect(screen.queryByText("Total Pendaftar")).toBeNull();
	});

	it("kartu dibuat lebar penuh di grid (md:col-span-2)", () => {
		const { container } = render(<RegistrationChart />);
		expect((container.firstElementChild as HTMLElement).className).toContain(
			"md:col-span-2",
		);
	});
});

describe("RegistrationChart: rentang 6 / 12 bulan", () => {
	it("layar lebar: default 12 bulan", () => {
		state.isMobile = false;
		render(<RegistrationChart />);
		expect(bulanTerakhir()).toBe(12);
		expect(screen.getByText(/12 bulan terakhir/)).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "12 Bln" })
				.getAttribute("aria-pressed"),
		).toBe("true");
	});

	it("HP: default 6 bulan", () => {
		state.isMobile = true;
		render(<RegistrationChart />);
		expect(bulanTerakhir()).toBe(6);
		expect(screen.getByText(/6 bulan terakhir/)).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "6 Bln" })
				.getAttribute("aria-pressed"),
		).toBe("true");
	});

	it("bisa diganti manual, mengalahkan default layar", () => {
		state.isMobile = true; // default 6
		render(<RegistrationChart />);
		fireEvent.click(screen.getByRole("button", { name: "12 Bln" }));
		expect(bulanTerakhir()).toBe(12);
		fireEvent.click(screen.getByRole("button", { name: "6 Bln" }));
		expect(bulanTerakhir()).toBe(6);
	});

	it("mengirim cabangId kosong untuk 'ALL' agar tidak difilter", () => {
		render(<RegistrationChart />);
		expect(
			(state.inputs.at(-1) as { cabangId?: string }).cabangId,
		).toBeUndefined();
	});
});