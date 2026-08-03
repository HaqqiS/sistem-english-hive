/** biome-ignore-all lint/suspicious/noExplicitAny: false positive */
import {
	type Kelas,
	type PendaftaranKelas,
	type PrismaClient,
	StatusPendaftaran,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as PembayaranService from "../../server/services/pembayaran.service";
import {
	createBulkPendaftaran,
	createPendaftaran,
} from "../../server/services/pendaftaran.service";

// Mock Pembayaran Service logic
// PENTING: path di vi.mock() harus SAMA PERSIS dengan path di import di atas,
// kalau tidak, Vitest tidak akan meng-intercept module aslinya.
//
// pendaftaran.service.ts sekarang memanggil generateTagihan() (bukan lagi
// tx.pembayaran.create langsung), jadi generateTagihan juga wajib di-mock,
// kalau tidak Vitest akan komplain "No export is defined on the mock".
vi.mock("../../server/services/pembayaran.service", () => ({
	calculateInitialBill: vi.fn(),
	generateTagihan: vi.fn(),
}));

describe("Pendaftaran Service", () => {
	const mockTx = {
		pendaftaranKelas: {
			create: vi.fn(),
			// Dibutuhkan oleh syncMuridStatus() yang dipanggil di dalam
			// createPendaftaran/createBulkPendaftaran.
			findMany: vi.fn().mockResolvedValue([]),
		},
		pembayaran: {
			create: vi.fn(),
		},
		kelas: {
			findFirst: vi.fn(),
		},
		murid: {
			update: vi.fn(),
			updateMany: vi.fn(),
		},
	} as unknown as PrismaClient;

	beforeEach(() => {
		vi.clearAllMocks();
		// vi.clearAllMocks() mereset implementasi mockResolvedValue juga,
		// jadi perlu di-set ulang tiap test supaya syncMuridStatus tidak error.
		vi.mocked(mockTx.pendaftaranKelas.findMany).mockResolvedValue([]);
	});

	describe("createPendaftaran", () => {
		it("should create registration and initial bill", async () => {
			// Mock calculateInitialBill return
			vi.mocked(PembayaranService.calculateInitialBill).mockReturnValue({
				totalTagihan: 100000,
				jumlahSesiDibayar: 2,
				pembayaranKe: 1,
				note: "Test Bill",
				sesiMasuk: 1,
			});

			vi.mocked(mockTx.pendaftaranKelas.create).mockResolvedValue({
				id: "reg-1",
			} as unknown as PendaftaranKelas);

			const params = {
				tx: mockTx,
				input: {
					muridId: "m-1",
					kelasId: "k-1",
					tanggalMulai: "2024-01-01",
					status: StatusPendaftaran.AKTIF,
				} as any,
				kelas: {
					hargaKelas: 50000,
					cohortId: "c-1",
					level: 1,
				},
				jumlahSesiBerlalu: 0,
			};

			const result = await createPendaftaran(params as any);

			expect(mockTx.pendaftaranKelas.create).toHaveBeenCalled();
			// Sekarang tagihan dibuat lewat generateTagihan(), bukan langsung
			// tx.pembayaran.create.
			expect(PembayaranService.generateTagihan).toHaveBeenCalledWith(
				mockTx,
				expect.objectContaining({
					pendaftaranId: "reg-1",
					pembayaranKe: 1,
					jumlahBayar: 100000,
					note: "Test Bill",
				}),
			);
			expect(result.pendaftaran.id).toBe("reg-1");
		});

		it("should create registration with WAITING_LIST status (NO BILL)", async () => {
			vi.mocked(mockTx.pendaftaranKelas.create).mockResolvedValue({
				id: "reg-wl",
				status: StatusPendaftaran.WAITING_LIST,
			} as unknown as PendaftaranKelas);

			const params = {
				tx: mockTx,
				input: {
					muridId: "m-wl",
					kelasId: "k-1",
					tanggalMulai: null, // Allow null
					status: StatusPendaftaran.WAITING_LIST,
				} as any,
				kelas: {
					hargaKelas: 50000,
					cohortId: "c-1",
					level: 1,
				},
				jumlahSesiBerlalu: 0,
			};

			const result = await createPendaftaran(params as any);

			expect(mockTx.pendaftaranKelas.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						status: StatusPendaftaran.WAITING_LIST,
					}),
				}),
			);
			// Should NOT create bill
			expect(PembayaranService.generateTagihan).not.toHaveBeenCalled();
			expect(result.pendaftaran.id).toBe("reg-wl");
		});

		it("should handle very late joiner (auto-register next level)", async () => {
			// Mock Late Entry > 20
			vi.mocked(PembayaranService.calculateInitialBill).mockReturnValue({
				totalTagihan: 50000,
				jumlahSesiDibayar: 1,
				pembayaranKe: 3,
				note: "Test Late",
				sesiMasuk: 22, // Very late
			});

			vi.mocked(mockTx.pendaftaranKelas.create).mockResolvedValue({
				id: "reg-curr",
			} as unknown as PendaftaranKelas);
			// Mock finding next class
			vi.mocked(mockTx.kelas.findFirst).mockResolvedValue({
				id: "k-next",
				hargaKelas: 50000,
			} as unknown as Kelas);

			const params = {
				tx: mockTx,
				input: {
					muridId: "m-1",
					kelasId: "k-1",
					tanggalMulai: "2024-01-01",
					status: StatusPendaftaran.AKTIF,
				} as any,
				kelas: {
					hargaKelas: 50000,
					cohortId: "c-1",
					level: 1,
				},
				jumlahSesiBerlalu: 21,
			};

			await createPendaftaran(params as any);

			// Should verify next level create is called
			expect(mockTx.kelas.findFirst).toHaveBeenCalled();
			// Expect 2 registrations (Current + Next)
			expect(mockTx.pendaftaranKelas.create).toHaveBeenCalledTimes(2);
			// Expect 2 tagihan (Current bill + Next level auto-registration bill)
			expect(PembayaranService.generateTagihan).toHaveBeenCalledTimes(2);
			expect(PembayaranService.generateTagihan).toHaveBeenLastCalledWith(
				mockTx,
				expect.objectContaining({
					note: expect.stringContaining("Very Late Joiner"),
				}),
			);
		});
	});

	describe("createBulkPendaftaran", () => {
		it("should create multiple registrations", async () => {
			vi.mocked(PembayaranService.calculateInitialBill).mockReturnValue({
				totalTagihan: 100000,
				jumlahSesiDibayar: 2,
				pembayaranKe: 1,
				note: "Test Bill",
				sesiMasuk: 1,
			});

			vi.mocked(mockTx.pendaftaranKelas.create).mockResolvedValue({
				id: "reg-x",
			} as unknown as PendaftaranKelas);

			const params = {
				tx: mockTx,
				input: {
					muridIds: ["m-1", "m-2"],
					kelasId: "k-1",
					tanggalMulai: "2024-01-01",
					status: StatusPendaftaran.AKTIF,
				} as any,
				kelas: {
					hargaKelas: 50000,
					cohortId: "c-1",
					level: 1,
				},
				jumlahSesiBerlalu: 0,
			};

			const result = await createBulkPendaftaran(params as any);

			expect(result.success).toBe(true);
			expect(result.count).toBe(2);
			expect(mockTx.pendaftaranKelas.create).toHaveBeenCalledTimes(2);
			expect(PembayaranService.generateTagihan).toHaveBeenCalledTimes(2);
		});
	});
});
