import {
	Hari,
	type JadwalKelas,
	type JamSlotTetap,
	type Kelas,
	type PrismaClient,
	type Ruang,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
	createBulkJadwal,
	updateJadwal,
} from "../../server/services/jadwal.service";

describe("Jadwal Service", () => {
	const mockTx = {
		kelas: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
		ruang: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
		jamSlotTetap: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
		jamSlotCustom: {
			findFirst: vi.fn(),
			create: vi.fn(),
		},
		jadwalKelas: {
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			findUnique: vi.fn(),
		},
	} as unknown as PrismaClient; // Using PrismaClient type for easy casting, though it's technically PrismaTx

	// Helper to reset mocks
	const resetMocks = () => {
		vi.clearAllMocks();
	};

	describe("createBulkJadwal", () => {
		it("should throw error if class/room not found", async () => {
			resetMocks();
			vi.mocked(mockTx.kelas.findMany).mockResolvedValue([]);
			vi.mocked(mockTx.ruang.findMany).mockResolvedValue([]);

			const input = [
				{
					kelasId: "kelas-1",
					ruangId: "ruang-1",
					hari: Hari.SENIN,
					tipeJam: "TETAP" as const,
					jamSlotTetapId: "slot-1",
				},
			];

			await expect(
				createBulkJadwal({ tx: mockTx, input, allowedCabangId: null }),
			).rejects.toThrow();
		});

		it("should throw error if branch mismatch", async () => {
			resetMocks();
			vi.mocked(mockTx.kelas.findMany).mockResolvedValue([
				{
					id: "kelas-1",
					cabangId: "cabang-A",
					kodeKelas: "K1",
				} as unknown as Kelas,
			]);
			vi.mocked(mockTx.ruang.findMany).mockResolvedValue([
				{
					id: "ruang-1",
					cabangId: "cabang-B",
					namaRuang: "R1",
				} as unknown as Ruang,
			]);

			const input = [
				{
					kelasId: "kelas-1",
					ruangId: "ruang-1",
					hari: Hari.SENIN,
					tipeJam: "TETAP" as const,
					jamSlotTetapId: "slot-1",
				},
			];

			await expect(
				createBulkJadwal({ tx: mockTx, input, allowedCabangId: null }),
			).rejects.toThrow();
		});

		it("should detect schedule collision", async () => {
			resetMocks();
			vi.mocked(mockTx.kelas.findMany).mockResolvedValue([
				{
					id: "kelas-1",
					cabangId: "cabang-A",
					kodeKelas: "K1",
				} as unknown as Kelas,
			]);
			vi.mocked(mockTx.ruang.findMany).mockResolvedValue([
				{
					id: "ruang-1",
					cabangId: "cabang-A",
					namaRuang: "R1",
				} as unknown as Ruang,
			]);
			vi.mocked(mockTx.jamSlotTetap.findMany).mockResolvedValue([
				{
					id: "slot-1",
					cabangId: "cabang-A",
					jamMulai: "08:00",
					jamSelesai: "10:00",
				} as unknown as JamSlotTetap,
			]);
			vi.mocked(mockTx.jadwalKelas.findFirst).mockResolvedValue({
				id: "jadwal-conflict",
				kelas: { kodeKelas: "K2" },
			} as unknown as JadwalKelas);

			const input = [
				{
					kelasId: "kelas-1",
					ruangId: "ruang-1",
					hari: Hari.SENIN,
					tipeJam: "TETAP" as const,
					jamSlotTetapId: "slot-1",
				},
			];

			await expect(
				createBulkJadwal({ tx: mockTx, input, allowedCabangId: null }),
			).rejects.toThrow("Bentrok Jadwal");
		});

		it("should create schedule successfully", async () => {
			resetMocks();
			vi.mocked(mockTx.kelas.findMany).mockResolvedValue([
				{
					id: "kelas-1",
					cabangId: "cabang-A",
					kodeKelas: "K1",
				} as unknown as Kelas,
			]);
			vi.mocked(mockTx.ruang.findMany).mockResolvedValue([
				{
					id: "ruang-1",
					cabangId: "cabang-A",
					namaRuang: "R1",
				} as unknown as Ruang,
			]);
			vi.mocked(mockTx.jamSlotTetap.findMany).mockResolvedValue([
				{
					id: "slot-1",
					cabangId: "cabang-A",
					jamMulai: "08:00",
					jamSelesai: "10:00",
				} as unknown as JamSlotTetap,
			]);
			vi.mocked(mockTx.jadwalKelas.findFirst).mockResolvedValue(null);
			vi.mocked(mockTx.jadwalKelas.create).mockResolvedValue({
				id: "new-jadwal",
			} as unknown as JadwalKelas);

			const input = [
				{
					kelasId: "kelas-1",
					ruangId: "ruang-1",
					hari: Hari.SENIN,
					tipeJam: "TETAP" as const,
					jamSlotTetapId: "slot-1",
				},
			];

			const result = await createBulkJadwal({
				tx: mockTx,
				input,
				allowedCabangId: null,
			});

			expect(result).toHaveLength(1);
			expect(mockTx.jadwalKelas.create).toHaveBeenCalled();
		});
	});

	describe("updateJadwal", () => {
		it("should validate existing schedule", async () => {
			resetMocks();
			vi.mocked(mockTx.jadwalKelas.findUnique).mockResolvedValue(null);

			await expect(
				updateJadwal({
					tx: mockTx,
					id: "j-1",
					// biome-ignore lint/suspicious/noExplicitAny: mock input
					input: {} as any,
					allowedCabangId: null,
				}),
			).rejects.toThrow("Jadwal tidak ditemukan");
		});
	});
});
