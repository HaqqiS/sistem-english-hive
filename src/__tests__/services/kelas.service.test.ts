/** biome-ignore-all lint/suspicious/noExplicitAny: false positive */
import type {
	HistoryGuruKelas,
	JadwalKelas,
	Kelas,
	PendaftaranKelas,
	PrismaClient,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
	handleAutoLevelUp,
	handleClassCompletion,
} from "../../server/services/kelas.service";

describe("Kelas Service", () => {
	const mockTx = {
		kelas: {
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		historyGuruKelas: {
			findFirst: vi.fn(),
			create: vi.fn(),
			updateMany: vi.fn(),
		},
		jadwalKelas: {
			findMany: vi.fn(),
			createMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		pendaftaranKelas: {
			findMany: vi.fn(),
			create: vi.fn(),
			updateMany: vi.fn(),
		},
		pembayaran: {
			create: vi.fn(),
		},
	} as unknown as PrismaClient;

	const resetMocks = () => vi.clearAllMocks();

	describe("handleAutoLevelUp", () => {
		it("should return null if no next program exists (End of Line)", async () => {
			resetMocks();

			vi.mocked(mockTx.kelas.findUnique).mockResolvedValue({
				level: 4,
				jenisKelasRel: {
					nama: "Elementary",
					nextLevel: null,
				},
			} as any);

			const result = await handleAutoLevelUp({
				tx: mockTx,
				jadwal: {
					kelasId: "k-1",
					ruangId: "r-1",
					kelas: {
						level: 4,
						jenisKelasRel: {
							nama: "Elementary",
							nextLevelId: null,
						},
					} as unknown as Kelas,
				},
			});
			expect(result).toBeNull();
		});

		it("should create new class (Level 1) of NEXT program if level is 4", async () => {
			resetMocks();
			// Mock existing check -> null (create new)
			vi.mocked(mockTx.kelas.findFirst).mockResolvedValue(null);
			// Mock create
			vi.mocked(mockTx.kelas.create).mockResolvedValue({
				id: "k-new-prog",
				jenisKelasId: "jen-tiny-star",
				level: 1,
			} as unknown as Kelas);
			// Mock other necessary calls...
			vi.mocked(mockTx.historyGuruKelas.findFirst).mockResolvedValue(null);
			vi.mocked(mockTx.jadwalKelas.findMany).mockResolvedValue([]);
			vi.mocked(mockTx.pendaftaranKelas.findMany).mockResolvedValue([]);

			// Mock findUnique for handleAutoLevelUp
			vi.mocked(mockTx.kelas.findUnique).mockResolvedValue({
				id: "k-old",
				level: 4,
				jenisKelasId: "jen-tiny-tods",
				kodeKelas: "TinyTods 4-A | 01/2024",
				cohortId: "cohort-1",
				hargaKelas: 60000,
				grup: "A",
				cabangId: "cab-1",
				jenisKelasRel: {
					id: "jen-tiny-tods",
					nama: "TinyTods",
					harga: 60000,
					nextLevel: {
						id: "jen-tiny-star",
						nama: "TinyStar",
						harga: 60000,
					},
				},
			} as any);

			const result = await handleAutoLevelUp({
				tx: mockTx,
				jadwal: {
					kelasId: "k-old",
					ruangId: "r-1",
				},
			});

			// Verify Create was called with Level 1 and new ID
			expect(mockTx.kelas.create).toHaveBeenCalled();
			const createCalls = vi.mocked(mockTx.kelas.create).mock.calls;
			if (!createCalls[0] || !createCalls[0][0])
				throw new Error("Create not called");
			const createCall = createCalls[0][0];

			expect(createCall.data.level).toBe(1); // Reset to 1
			expect(createCall.data.jenisKelasId).toBe("jen-tiny-star"); // Changed Program to Next Level ID

			// Verify name replacement logic (TinyTods 4 -> TinyStar 1)
			expect(createCall.data.kodeKelas).toContain("TinyStar 1");

			// Also verify the function returns exactly what create() returned
			expect(result).toEqual({
				id: "k-new-prog",
				jenisKelasId: "jen-tiny-star",
				level: 1,
			});
		});

		it("should create new class if level < 4", async () => {
			resetMocks();
			// Mock existing check -> null (create new)
			vi.mocked(mockTx.kelas.findFirst).mockResolvedValue(null);
			// Mock create
			vi.mocked(mockTx.kelas.create).mockResolvedValue({
				id: "k-new",
			} as unknown as Kelas);
			// Mock prev guru
			vi.mocked(mockTx.historyGuruKelas.findFirst).mockResolvedValue({
				guruId: "g-1",
			} as unknown as HistoryGuruKelas);
			// Mock old schedules
			vi.mocked(mockTx.jadwalKelas.findMany).mockResolvedValue([
				{ id: "j-1", hari: "SENIN" } as unknown as JadwalKelas,
			]);
			// Mock active students
			vi.mocked(mockTx.pendaftaranKelas.findMany).mockResolvedValue([
				{ muridId: "m-1" } as unknown as PendaftaranKelas,
			]);
			// Mock registration create
			vi.mocked(mockTx.pendaftaranKelas.create).mockResolvedValue({
				id: "reg-new",
			} as unknown as PendaftaranKelas);

			// Mock findUnique
			vi.mocked(mockTx.kelas.findUnique).mockResolvedValue({
				id: "k-1",
				level: 1,
				jenisKelasId: "jen-reg",
				kodeKelas: "REG 1 | 01/2024",
				cohortId: "cohort-1",
				hargaKelas: 50000,
				grup: "A",
				cabangId: "cab-1",
				jenisKelasRel: {
					id: "jen-reg",
					nama: "Regular",
					harga: 50000,
					nextLevel: { id: "jen-next", nama: "RegularNext" },
				},
			} as any);

			const result = await handleAutoLevelUp({
				tx: mockTx,
				jadwal: {
					kelasId: "k-1",
					ruangId: "r-1",
				},
			});

			expect(result).toEqual({ id: "k-new" });
			expect(mockTx.kelas.create).toHaveBeenCalled();
			// Should create next level (Level 2)
			const createCalls = vi.mocked(mockTx.kelas.create).mock.calls;
			if (!createCalls[0] || !createCalls[0][0])
				throw new Error("Create call not found");
			const createCall = createCalls[0][0];
			expect(createCall.data.level).toBe(2);

			// Should copy schedules
			expect(mockTx.jadwalKelas.createMany).toHaveBeenCalled();

			// Should move students
			expect(mockTx.pendaftaranKelas.create).toHaveBeenCalled();
			expect(mockTx.pembayaran.create).toHaveBeenCalled(); // Pending bill
		});
	});

	describe("handleClassCompletion", () => {
		it("should complete class if sessions >= 24", async () => {
			resetMocks();
			const result = await handleClassCompletion(mockTx, "k-1", 24);

			expect(result).toBe(true);
			expect(mockTx.pendaftaranKelas.updateMany).toHaveBeenCalledWith({
				where: { kelasId: "k-1" },
				data: { isAktif: false },
			});
		});

		it("should not complete class if sessions < 24", async () => {
			resetMocks();
			const result = await handleClassCompletion(mockTx, "k-1", 23);

			expect(result).toBe(false);
			expect(mockTx.pendaftaranKelas.updateMany).not.toHaveBeenCalled();
		});
	});
});
