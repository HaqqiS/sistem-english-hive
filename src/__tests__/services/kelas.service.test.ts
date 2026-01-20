import type {
	HistoryGuruKelas,
	JadwalKelas,
	JenisKelas,
	Kelas,
	PendaftaranKelas,
	PrismaClient,
} from "@prisma/client";
import { StatusPendaftaran } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
	handleAutoLevelUp,
	handleClassCompletion,
} from "../../server/services/kelas.service";

// Define a type for the transaction client
type PrismaTx = Omit<
	PrismaClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

describe("Kelas Service", () => {
	// Create a mock transaction object with properly typed mocks
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
		tagihanLain: {
			create: vi.fn(),
		},
	} as unknown as PrismaTx;

	const resetMocks = () => vi.clearAllMocks();

	describe("handleAutoLevelUp", () => {
		// Types for Mocks
		type MockKelasWithRelations = Kelas & {
			jenisKelasRel: JenisKelas & { nextLevel: JenisKelas | null };
		};

		it("should return null if class or master data not found", async () => {
			resetMocks();
			// Mock findUnique to return null
			vi.mocked(mockTx.kelas.findUnique).mockResolvedValue(null);

			const result = await handleAutoLevelUp({
				tx: mockTx,
				jadwal: {
					kelasId: "k-miss",
					ruangId: "r-1",
				},
			});
			expect(result).toBeNull();
		});

		it("should return null if max level reached and no next program (Database Check)", async () => {
			resetMocks();

			vi.mocked(mockTx.kelas.findUnique).mockResolvedValue({
				id: "k-max",
				level: 4,
				jenisKelasId: "jen-max",
				cohortId: "cohort-1",
				jenisKelasRel: {
					id: "jen-max",
					nama: "HighLevel",
					harga: 100000,
					nextLevel: null, // No next level
				},
			} as unknown as MockKelasWithRelations);

			const result = await handleAutoLevelUp({
				tx: mockTx,
				jadwal: {
					kelasId: "k-max",
					ruangId: "r-1",
				},
			});
			expect(result).toBeNull();
		});

		it("should return existing class if target class already exists", async () => {
			resetMocks();
			// Setup: Current is Level 1, Target is Level 2
			vi.mocked(mockTx.kelas.findUnique).mockResolvedValue({
				id: "k-1",
				level: 1,
				cohortId: "c-1",
				jenisKelasRel: {
					id: "jen-1",
					nama: "Basic",
					harga: 50000,
					nextLevel: null,
				},
			} as unknown as MockKelasWithRelations);

			// Mock finding existing class
			const existingClass = { id: "k-existing" } as Kelas;
			vi.mocked(mockTx.kelas.findFirst).mockResolvedValue(existingClass);

			const result = await handleAutoLevelUp({
				tx: mockTx,
				jadwal: { kelasId: "k-1", ruangId: "r-1" },
			});

			expect(result).toEqual(existingClass);
			expect(mockTx.kelas.create).not.toHaveBeenCalled();
		});

		it("should create new class (Level 1) of NEXT program if level is 4", async () => {
			resetMocks();

			// 1. Mock existing check -> null (create new)
			vi.mocked(mockTx.kelas.findFirst).mockResolvedValue(null);

			// 2. Mock create new class
			vi.mocked(mockTx.kelas.create).mockResolvedValue({
				id: "k-new-prog",
				jenisKelasId: "jen-tiny-star",
				level: 1,
				kodeKelas: "TinyStar 1 | 01/2026",
				hargaKelas: 70000,
			} as Kelas);

			// 3. Mock dependencies (Guru, Jadwal, Murid)
			vi.mocked(mockTx.historyGuruKelas.findFirst).mockResolvedValue(null);
			vi.mocked(mockTx.jadwalKelas.findMany).mockResolvedValue([]);
			vi.mocked(mockTx.pendaftaranKelas.findMany).mockResolvedValue([]);

			// 4. Mock findUnique for Current Class
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
						harga: 70000,
						hargaBuku: 50000, // Has book price
					},
				},
			} as unknown as MockKelasWithRelations);

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
			if (!createCalls[0]) throw new Error("Create not called");
			const createCall = createCalls[0][0];

			expect(createCall.data.level).toBe(1); // Reset to 1
			expect(createCall.data.jenisKelasId).toBe("jen-tiny-star"); // Changed Program to Next Level ID
			expect(createCall.data.hargaKelas).toBe(70000); // New Price

			// Verify name replacement logic (TinyTods 4 -> TinyStar 1)
			expect(createCall.data.kodeKelas).toContain("TinyStar 1");

			expect(result).toEqual({
				id: "k-new-prog",
				jenisKelasId: "jen-tiny-star",
				level: 1,
				kodeKelas: "TinyStar 1 | 01/2026",
				hargaKelas: 70000,
			});
		});

		it("should create new class (Level + 1) if level < 4 and migrate resources", async () => {
			resetMocks();
			// Setup: Level 1 -> 2
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
					hargaBuku: 0, // No book price
					nextLevel: { id: "jen-next", nama: "RegularNext" },
				},
			} as unknown as MockKelasWithRelations);

			// Mock existing check -> null (create new)
			vi.mocked(mockTx.kelas.findFirst).mockResolvedValue(null);

			// Mock create class
			vi.mocked(mockTx.kelas.create).mockResolvedValue({
				id: "k-new",
				level: 2,
				hargaKelas: 50000,
			} as Kelas);

			// Mock prev guru
			vi.mocked(mockTx.historyGuruKelas.findFirst).mockResolvedValue({
				guruId: "g-1",
			} as HistoryGuruKelas);

			// Mock old schedules
			vi.mocked(mockTx.jadwalKelas.findMany).mockResolvedValue([
				{
					id: "j-1",
					hari: "SENIN",
					ruangId: "r-1",
					jamSlotTetapId: "jst-1",
				} as JadwalKelas,
			]);

			// Mock active students
			vi.mocked(mockTx.pendaftaranKelas.findMany).mockResolvedValue([
				{ muridId: "m-1" } as PendaftaranKelas,
			]);

			// Mock registration create
			vi.mocked(mockTx.pendaftaranKelas.create).mockResolvedValue({
				id: "reg-new",
			} as PendaftaranKelas);

			const result = await handleAutoLevelUp({
				tx: mockTx,
				jadwal: {
					kelasId: "k-1",
					ruangId: "r-1",
				},
			});

			expect(result).toEqual({ id: "k-new", level: 2, hargaKelas: 50000 });
			// Validation: Class Creation
			expect(mockTx.kelas.create).toHaveBeenCalled();
			const createCalls = vi.mocked(mockTx.kelas.create).mock.calls;
			if (!createCalls[0]) throw new Error("Create not called");
			const createCall = createCalls[0][0];
			expect(createCall.data.level).toBe(2);

			// Validation: Teacher Migration
			expect(mockTx.historyGuruKelas.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						guruId: "g-1",
						kelasId: "k-new",
					}),
				}),
			);

			// Validation: Schedule Copy
			expect(mockTx.jadwalKelas.createMany).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.arrayContaining([
						expect.objectContaining({ kelasId: "k-new", hari: "SENIN" }),
					]),
				}),
			);

			// Validation: Student Migration
			expect(mockTx.pendaftaranKelas.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						muridId: "m-1",
						kelasId: "k-new",
						status: StatusPendaftaran.AKTIF,
					}),
				}),
			);

			// Validation: Payment Generation (SPP)
			expect(mockTx.pembayaran.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						pembayaranKe: 1,
						statusBayar: "PENDING",
					}),
				}),
			);

			// Validation: Book Fee (Should NOT be called as hargaBuku is 0)
			expect(mockTx.tagihanLain.create).not.toHaveBeenCalled();
		});

		it("should create book fee if price > 0", async () => {
			resetMocks();
			// Setup: Level 1 -> 2 with Book Fee
			vi.mocked(mockTx.kelas.findUnique).mockResolvedValue({
				id: "k-1",
				level: 1,
				jenisKelasId: "jen-reg",
				cohortId: "c-1",
				kodeKelas: "A",
				jenisKelasRel: {
					id: "jen-reg",
					nama: "Regular",
					harga: 50000,
					hargaBuku: 25000, // Has book price
					nextLevel: null,
				},
			} as unknown as MockKelasWithRelations);

			vi.mocked(mockTx.kelas.findFirst).mockResolvedValue(null);
			vi.mocked(mockTx.kelas.create).mockResolvedValue({
				id: "k-new",
				level: 2,
				hargaKelas: 50000,
			} as Kelas);
			vi.mocked(mockTx.pendaftaranKelas.findMany).mockResolvedValue([
				{ muridId: "m-1" } as PendaftaranKelas,
			]);
			vi.mocked(mockTx.pendaftaranKelas.create).mockResolvedValue({
				id: "reg-new",
			} as PendaftaranKelas);

			await handleAutoLevelUp({
				tx: mockTx,
				jadwal: { kelasId: "k-1", ruangId: "r-1" },
			});

			expect(mockTx.tagihanLain.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						kategori: "BUKU",
						jumlah: 25000,
						muridId: "m-1",
					}),
				}),
			);
		});
	});

	describe("handleClassCompletion", () => {
		it("should complete class if sessions >= 24", async () => {
			resetMocks();
			const result = await handleClassCompletion(mockTx, "k-1", 24);

			expect(result).toBe(true);

			// Verify Pendaftaran Update
			expect(mockTx.pendaftaranKelas.updateMany).toHaveBeenCalledWith({
				where: { kelasId: "k-1" },
				data: { status: StatusPendaftaran.NON_AKTIF }, // Ensure enum is used
			});

			// Verify Schedule Deletion
			expect(mockTx.jadwalKelas.deleteMany).toHaveBeenCalledWith({
				where: { kelasId: "k-1" },
			});

			// Verify Teacher Status Update
			expect(mockTx.historyGuruKelas.updateMany).toHaveBeenCalledWith({
				where: { kelasId: "k-1", statusGuru: "ACTIVE" },
				data: expect.objectContaining({
					statusGuru: "INACTIVE",
				}),
			});
		});

		it("should not complete class if sessions < 24", async () => {
			resetMocks();
			const result = await handleClassCompletion(mockTx, "k-1", 23);

			expect(result).toBe(false);
			expect(mockTx.pendaftaranKelas.updateMany).not.toHaveBeenCalled();
			expect(mockTx.jadwalKelas.deleteMany).not.toHaveBeenCalled();
		});
	});
});
