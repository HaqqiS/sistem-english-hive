import type {
	Pembayaran,
	Prisma,
	PrismaClient,
	TipeKelas,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
	calculateInitialBill,
	calculateSisaPertemuan,
	generateTagihan,
} from "../../server/services/pembayaran.service";

// Mock Data Constants
const MOCK_PENDAFTARAN_ID = "pendaftaran-1";
const MOCK_KELAS_ID = "kelas-1";
const MOCK_MURID_ID = "murid-1";
const HARGA_PER_SESI = 50000;

describe("calculateSisaPertemuan (Hybrid Billing Logic)", () => {
	const mockDb = {
		pendaftaranKelas: {
			findUnique: vi.fn(),
		},
		pembayaran: {
			findMany: vi.fn(),
		},
		absensiMurid: {
			count: vi.fn(),
		},
		sesiPertemuanKelas: {
			count: vi.fn(),
		},
	} as unknown as PrismaClient;

	// Helper for mocking return types
	// Gunakan payload type dengan include untuk mendukung relasi
	type MockPendaftaran = Prisma.PendaftaranKelasGetPayload<{
		include: { Kelas: true; murid: true };
	}> | null;

	// Select used in service: { jumlahBayar: true, pembayaranKe: true }
	// Tapi mock return full object gpp.
	type MockPembayarans = Pembayaran[];

	const setupMocks = (
		paidSessions: number, // Berapa sesi murid sudah bayar (Total Uang)
		usedSessions: number, // Berapa sesi murid hadir
		classPassedSessions: number, // Berapa sesi kelas sudah jalan
	) => {
		// 1. Mock Pendaftaran
		// Note: Gunakan 'as unknown as MockPendaftaran' jika properti parsial.
		// Tapi lebih aman kita bikin partial type

		const mockPendaftaran = {
			id: MOCK_PENDAFTARAN_ID,
			kelasId: MOCK_KELAS_ID,
			muridId: MOCK_MURID_ID,
			tanggalMulai: "2024-01-01",
			isAktif: true,
			status: "AKTIF",
			createdAt: new Date(),
			updatedAt: new Date(),
			Kelas: {
				hargaKelas: HARGA_PER_SESI,
				id: MOCK_KELAS_ID,
				kodeKelas: "KELAS-A",
				// add required fields to satisfy type or cast
				cabangId: "cabang-1",
				jenisKelasId: "jk-1",
				jenisKelasRel: {
					id: "jk-1",
					nama: "Regular",
					tipe: "REGULAR" as TipeKelas,
				},
				legacyJenisKelas: null,
				legacyTipe: null,
				level: 1,
				// tipe: "REGULAR", // Removed
				grup: "A",
				bulanTahunAjar: "01/2024",
				deskripsi: null,
				cohortId: "cohort-1",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			murid: {
				id: MOCK_MURID_ID,
				namaLengkap: "Budi",
				// add required
				email: "budi@test.com",
				alamat: "Jl Test",
				gender: "LAKI_LAKI",
				umur: 10,
				asalSekolah: "SD",
				kelasSekolah: "1",
				jamPulang: "12:00",
				noWA: "08123",
				pilihanProgram: null,
				sumberInfo: "Teman",
				statusMurid: "AKTIF",
				deskripsi: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				cabangId: "cabang-1",
			},
		};

		vi.mocked(mockDb.pendaftaranKelas.findUnique).mockResolvedValue(
			mockPendaftaran as unknown as MockPendaftaran,
		); // Now it matches payload type

		// 2. Mock Pembayaran (Credit)
		const mockBills: MockPembayarans = [];

		if (paidSessions > 0) {
			const blocksPaid = Math.floor(paidSessions / 8);
			// Jika paid 8 -> we assume it's exactly 1 block paid.
			// Logic simplification: We just need to return objects with jumlahBayar & pembayaranKe
			// Logic Code uses: .findMany -> returns array.

			// Case: paid 8 sessions. blocksPaid = 1.
			for (let i = 1; i <= blocksPaid; i++) {
				mockBills.push({
					id: `bill-${i}`,
					pendaftaranKelasId: MOCK_PENDAFTARAN_ID,
					pembayaranKe: i,
					jumlahBayar: 8 * HARGA_PER_SESI, // Asumsi bayar per blok penuh
					statusBayar: "LUNAS",
					// fields lain yg mandatory di Prisma Type tapi gak dipake logic:
					tanggalJatuhTempo: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
					verifiedById: "admin-1",
					note: null,
					tanggalBayar: new Date(),
					imageUrl: null,
				});
			}

			// If exact match paidSessions but partial blocks (e.g. paid 4 sessions)?
			// The tests use multiple of 8 (8, 16).
			// So this loop works for test cases.
		}

		vi.mocked(mockDb.pembayaran.findMany).mockResolvedValue(
			mockBills as MockPembayarans,
		);

		// 3. Mock Absensi (Debit)
		vi.mocked(mockDb.absensiMurid.count).mockResolvedValue(usedSessions);

		// 4. Mock Class Progress (New Hybrid Logic)
		vi.mocked(mockDb.sesiPertemuanKelas.count).mockResolvedValue(
			classPassedSessions,
		);
	};

	// Reset mocks before each test
	vi.clearAllMocks();

	it("Scenario 1: Normal Flow - Tagihan muncul saat sisa saldo tinggal 2", async () => {
		// Murid Bayar 8. Pakai 6. Sisa 2. -> TRIGGER TRUE
		// Class Progress 6 (Jalan normal).
		setupMocks(8, 6, 6);

		const result = await calculateSisaPertemuan(mockDb, MOCK_PENDAFTARAN_ID);

		expect(result.sisaPertemuan).toBe(2);
		expect(result.needNewBill).toBe(true);
		expect(result.nextBillPembayaranKe).toBe(2); // Karena max 1, next 2
	});

	it("Scenario 2: Safe Zone - Masih banyak saldo", async () => {
		// Murid Bayar 8. Pakai 3. Sisa 5. -> TRIGGER FALSE
		// Class Progress 3.
		setupMocks(8, 3, 3);

		const result = await calculateSisaPertemuan(mockDb, MOCK_PENDAFTARAN_ID);

		expect(result.sisaPertemuan).toBe(5);
		expect(result.needNewBill).toBe(false);
	});

	it("Scenario 3: Hybrid Trigger - Murid Cuti (Saldo Banyak), Tapi Kelas Lanjut", async () => {
		// Murid Bayar 8.
		// Murid Cuti 3x (Absen cuma 3). Sisa Saldo: 8 - 3 = 5. (Aman secara Logic A)
		// Tapi Kelas sudah Sesi 6. (Mencapai Trigger Point Blok 1)

		setupMocks(8, 3, 6);

		const result = await calculateSisaPertemuan(mockDb, MOCK_PENDAFTARAN_ID);

		// Secara saldo, dia masih punya 5.
		expect(result.sisaPertemuan).toBe(5);

		// Tapi secara sinkronisasi kelas, dia harus ditagih untuk Blok 2
		// Karena kelas sdh sesi 6 (Approaching end of Block 1). Target Sesi Akhir = 8.
		// Distance = 2.
		// Murid baru bayar sampai Blok 1 (PembayaranKe 1).
		// Target PembayaranKe = 2.
		// 1 < 2 -> TRIGGER YES.

		expect(result.needNewBill).toBe(true);
		expect(result.nextBillPembayaranKe).toBe(2);
	});

	it("Scenario 4: Hybrid Trigger - Sudah Bayar Lunas (Tidak Double Tagihan)", async () => {
		// Murid Rajin (atau sudah lunas di muka).
		// Murid Bayar 16 Sesi (Blok 1 & 2).
		// Kelas Sesi 6.
		// Trigger Point Blok 1 aktif (Distance 2).
		// Tapi Murid sudah bayar Blok 2 (MaxPembayaranKe = 2).
		// Target = 2.
		// 2 < 2 is FALSE. -> No New Bill.

		setupMocks(16, 6, 6);

		const result = await calculateSisaPertemuan(mockDb, MOCK_PENDAFTARAN_ID);

		expect(result.needNewBill).toBe(false); // Harusnya false karena sudah lunas
	});
});

describe("generateTagihan", () => {
	const mockDb = {
		pembayaran: {
			findFirst: vi.fn(),
			create: vi.fn(),
		},
	} as unknown as PrismaClient;

	it("should return existing bill if found", async () => {
		const mockExistingBill = { id: "bill-1" };
		vi.mocked(mockDb.pembayaran.findFirst).mockResolvedValue(
			mockExistingBill as unknown as Pembayaran,
		);

		const result = await generateTagihan(mockDb, {
			pendaftaranId: "p-1",
			pembayaranKe: 1,
			jumlahBayar: 50000,
			jatuhTempo: new Date(),
			note: "test",
		});

		expect(result).toBe(mockExistingBill);
		expect(mockDb.pembayaran.create).not.toHaveBeenCalled();
	});

	it("should create new bill if not found", async () => {
		vi.mocked(mockDb.pembayaran.findFirst).mockResolvedValue(null);
		const mockNewBill = { id: "bill-new" };
		vi.mocked(mockDb.pembayaran.create).mockResolvedValue(
			mockNewBill as unknown as Pembayaran,
		);

		const result = await generateTagihan(mockDb, {
			pendaftaranId: "p-1",
			pembayaranKe: 1,
			jumlahBayar: 50000,
			jatuhTempo: new Date(),
			note: "test",
		});

		expect(result).toBe(mockNewBill);
		expect(mockDb.pembayaran.create).toHaveBeenCalled();
	});
});

describe("calculateInitialBill", () => {
	const HARGA = 50000;

	it("should calculate for Block 1 (Session 1-6)", () => {
		// e.g. Join at Session 1 (0 passed)
		const result = calculateInitialBill(HARGA, 0);

		expect(result.pembayaranKe).toBe(1);
		expect(result.sesiMasuk).toBe(1);
		// Target 8. Pay 8 - 0 = 8 sessions.
		expect(result.jumlahSesiDibayar).toBe(8);
		expect(result.totalTagihan).toBe(8 * HARGA);
	});

	it("should calculate for Block 2 (Late Joiner, Session 7-14)", () => {
		// e.g. Join at Session 7 (6 passed)
		const result = calculateInitialBill(HARGA, 6);

		expect(result.pembayaranKe).toBe(2);
		expect(result.sesiMasuk).toBe(7);
		// Target 16. Pay 16 - 6 = 10 sessions.
		expect(result.jumlahSesiDibayar).toBe(10);
		expect(result.totalTagihan).toBe(10 * HARGA);
	});

	it("should calculate for Block 3 (Very Late Joiner, Session 15-24)", () => {
		// e.g. Join at Session 15 (14 passed)
		const result = calculateInitialBill(HARGA, 14);

		expect(result.pembayaranKe).toBe(3);
		expect(result.sesiMasuk).toBe(15);
		// Target 24. Pay 24 - 14 = 10 sessions.
		expect(result.jumlahSesiDibayar).toBe(10);
		expect(result.totalTagihan).toBe(10 * HARGA);
	});

	it("should throw error if session limit exceeded", () => {
		// 24 passed -> Join at 25.
		expect(() => calculateInitialBill(HARGA, 24)).toThrow(
			"Kelas ini sudah selesai",
		);
	});
});
