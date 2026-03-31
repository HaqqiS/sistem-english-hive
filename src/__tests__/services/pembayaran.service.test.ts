import type {
	Pembayaran,
	Prisma,
	PrismaClient,
	TipeKelas,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
			count: vi.fn(), // Per-kelas count (refactored from findMany)
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

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIBE BARU: nextBillAmount — 8 Case Billing Formula
// ─────────────────────────────────────────────────────────────────────────────
describe("calculateSisaPertemuan — nextBillAmount (8 Case Billing)", () => {
	// HARGA_PER_SESI = 37.500, HARGA_BLOK = 37.500 × 8 = 300.000
	const HARGA_PER_SESI = 37_500;
	const HARGA_BLOK = HARGA_PER_SESI * 8; // 300.000

	const mockDb = {
		pendaftaranKelas: { findUnique: vi.fn() },
		pembayaran: { findMany: vi.fn() },
		absensiMurid: { count: vi.fn() },
		sesiPertemuanKelas: { count: vi.fn() },
	} as unknown as PrismaClient;

	// Helper: setup mock pendaftaran + bills dengan nominal bebas
	const setupAdvanced = (
		bills: { pembayaranKe: number; jumlahBayar: number; lunas: boolean }[],
		usedSessions: number,
		classPassedSessions: number,
	) => {
		vi.mocked(mockDb.pendaftaranKelas.findUnique).mockResolvedValue({
			id: "p-1",
			kelasId: "kelas-1",
			muridId: "murid-1",
			tanggalMulai: "2024-01-01",
			isAktif: true,
			status: "AKTIF",
			createdAt: new Date(),
			updatedAt: new Date(),
			Kelas: {
				hargaKelas: HARGA_PER_SESI,
				id: "kelas-1",
				kodeKelas: "KELAS-A",
				cabangId: "cabang-1",
				jenisKelasId: "jk-1",
				jenisKelasRel: { id: "jk-1", nama: "Regular", tipe: "REGULAR" },
				legacyJenisKelas: null,
				legacyTipe: null,
				level: 1,
				grup: "A",
				bulanTahunAjar: "01/2024",
				deskripsi: null,
				cohortId: "cohort-1",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			murid: {
				id: "murid-1",
				namaLengkap: "Budi",
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
		} as unknown as Awaited<
			ReturnType<typeof mockDb.pendaftaranKelas.findUnique>
		>);

		// allBills (semua tagihan) — dipanggil findMany pertama
		// pembayaranLunas (hanya LUNAS) — dipanggil findMany kedua
		const allBillsMock = bills.map((b, i) => ({
			id: `bill-${i + 1}`,
			pendaftaranKelasId: "p-1",
			pembayaranKe: b.pembayaranKe,
			jumlahBayar: b.jumlahBayar,
			statusBayar: b.lunas ? "LUNAS" : "BELUM_LUNAS",
			tanggalJatuhTempo: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
			verifiedById: null,
			note: null,
			tanggalBayar: b.lunas ? new Date() : null,
			imageUrl: null,
		}));

		const lunasBillsMock = allBillsMock.filter(
			(b) => b.statusBayar === "LUNAS",
		);

		// findMany dipanggil 2x: pertama untuk lunas (kredit), kedua untuk allBills
		vi.mocked(mockDb.pembayaran.findMany)
			.mockResolvedValueOnce(lunasBillsMock as unknown as Pembayaran[]) // totalUangMasuk (LUNAS)
			.mockResolvedValueOnce(allBillsMock as unknown as Pembayaran[]); // allBills (trigger + ditagih)

		vi.mocked(mockDb.absensiMurid.count).mockResolvedValue(usedSessions);
		vi.mocked(mockDb.sesiPertemuanKelas.count).mockResolvedValue(
			classPassedSessions,
		);
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ── CASE 1: On-Point Join ──────────────────────────────────────────────────
	it("Case 1: On-point join — ke-1=300k LUNAS → nextBillAmount harus 300k (full blok)", async () => {
		// Murid daftar sebelum sesi dimulai, bayar ke-1=300k penuh
		setupAdvanced(
			[{ pembayaranKe: 1, jumlahBayar: HARGA_BLOK, lunas: true }],
			6, // hadir 6 sesi
			6, // kelas sudah sesi-6 (trigger point blok 1)
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		expect(result.needNewBill).toBe(true);
		expect(result.nextBillPembayaranKe).toBe(2);
		expect(result.nextBillAmount).toBe(HARGA_BLOK); // 300k
	});

	it("Case 1b: On-point join overpayment — ke-1=480k LUNAS → nextBillAmount harus 120k", async () => {
		// Murid bayar 480k penuh (sangat lebih dari 300k) di tagihan PERTAMA
		// Karena ini tagihan 1, maksimum rasional = 300k. Lebih dari 300k pasti overpayment!
		// Expected = 300k. Uang Masuk = 480k. Kelebihan = 180k.
		// Tagihan ke-2 = 300k - 180k = 120k.
		setupAdvanced(
			[{ pembayaranKe: 1, jumlahBayar: 480_000, lunas: true }],
			6, // hadir 6 sesi
			6, // kelas sudah sesi-6 (trigger point blok 1)
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		expect(result.needNewBill).toBe(true);
		expect(result.nextBillPembayaranKe).toBe(2);
		expect(result.nextBillAmount).toBe(120_000); // 120k ✅
	});

	// ── CASE 2: Late Join Early (sesi 1-5) ────────────────────────────────────
	it("Case 2: Late join early — ke-1=187.5k prorata (5 sesi) → nextBillAmount harus 300k (bukan 112.5k)", async () => {
		// Masuk di sesi-4: prorata = (8-3) × 37.500 = 187.500
		const ke1 = 5 * HARGA_PER_SESI; // 187.500
		setupAdvanced(
			[{ pembayaranKe: 1, jumlahBayar: ke1, lunas: true }],
			5,
			6, // kelas sesi-6, trigger blok 1
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		expect(result.needNewBill).toBe(true);
		expect(result.nextBillAmount).toBe(HARGA_BLOK); // 300k bukan 112.5k
	});

	it("Case 2b: Late join early (2 sesi sisa) — ke-1=75k prorata → nextBillAmount harus 300k", async () => {
		// Masuk di sesi-7 dalam blok 1: prorata = (8-6) × 37.500 = 75.000
		// (diperlakukan sebagai checkpoint1 edge)
		const ke1 = 2 * HARGA_PER_SESI; // 75.000
		setupAdvanced([{ pembayaranKe: 1, jumlahBayar: ke1, lunas: true }], 2, 6);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		expect(result.nextBillAmount).toBe(HARGA_BLOK); // 300k bukan 225k
	});

	// ── CASE 3: Late Join Middle (sesi 6-13) ──────────────────────────────────
	it("Case 3: Late join middle — ke-2=262.5k prorata (7 sesi) → nextBillAmount harus 300k", async () => {
		// Masuk di sesi-10: prorata = (16-9) × 37.500 = 262.500, pembayaranKe = 2
		const ke2 = 7 * HARGA_PER_SESI; // 262.500
		setupAdvanced(
			[{ pembayaranKe: 2, jumlahBayar: ke2, lunas: true }],
			7,
			14, // sesi-14, trigger blok 2
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		expect(result.needNewBill).toBe(true);
		expect(result.nextBillAmount).toBe(HARGA_BLOK); // 300k bukan 37.5k
	});

	// ── CASE 4: Late Join Very Late (sesi 14-24) ──────────────────────────────
	it("Case 4: Late join very late — ke-3=375k prorata (10 sesi, masuk sesi-15) → tidak auto-generate (circuit breaker)", async () => {
		// Masuk di sesi-15, kelas sudah sesi-20+ (circuit breaker)
		// Circuit breaker di absenMurid.router.ts (>= 20) → needNewBill mungkin true
		// tapi router tidak akan generate. Test di level service hanya cek nextBillAmount-nya benar.
		const ke3 = 10 * HARGA_PER_SESI; // 375.000
		setupAdvanced(
			[{ pembayaranKe: 3, jumlahBayar: ke3, lunas: true }],
			0, // belum ada absensi
			20, // kelas sudah sesi-20
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		// nextBillAmount harus tetap 300k meski ini blok terakhir
		expect(result.nextBillAmount).toBe(HARGA_BLOK);
	});

	// ── CASE 5: Late Join + Additional Class (top-up ke full blok) ────────────
	it("Case 5: Late join + additional class — ke-1=187.5k + ke-2=112.5k (top-up) → nextBillAmount harus 300k", async () => {
		// Murid join late, bayar prorata ke-1=187.5k
		// Lalu admin tambah "additional class" ke-2=112.5k (top-up ke blok penuh)
		// Total ditagih = 300k, total lunas = 300k → kelebihan = 0 → next = 300k
		const ke1 = 5 * HARGA_PER_SESI; // 187.500
		const ke2 = 3 * HARGA_PER_SESI; // 112.500 (top-up additional)
		setupAdvanced(
			[
				{ pembayaranKe: 1, jumlahBayar: ke1, lunas: true },
				{ pembayaranKe: 2, jumlahBayar: ke2, lunas: true },
			],
			8,
			14, // sesi-14, trigger blok 2
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		expect(result.needNewBill).toBe(true);
		expect(result.nextBillAmount).toBe(HARGA_BLOK); // 300k
	});

	// ── CASE 6: True Overpayment (murid bayar lebih dari tagihan) ─────────────
	it("Case 6: Overpayment — bayar 420k (db terupdate 420k) tapi tagihan seharusnya 300k → nextBillAmount harus 180k", async () => {
		// ke-1: ditagih 300k, dibayar 300k
		// ke-2: expected 300k, dibayar 420k (murid transfer lebih 120k, misal admin update DB jadi 420k)
		// total expected = 600k, total lunas = 720k → kelebihan = 120k → next = 180k
		const ke1Billed = HARGA_BLOK; // 300k
		const ke2Paid = HARGA_BLOK + 120_000; // 420k (aktual dibayar AND db value)

		setupAdvanced(
			[
				{ pembayaranKe: 1, jumlahBayar: ke1Billed, lunas: true },
				{ pembayaranKe: 2, jumlahBayar: ke2Paid, lunas: true },
			],
			14,
			14,
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		// Dulu limitasi skema membuat next = 300k.
		// Dengan `totalExpectedDitagih`, sistem cerdas mendeteksi Bill 2 expected-nya hanya 300k.
		expect(result.nextBillAmount).toBe(HARGA_BLOK - 120_000); // 180k
	});

	it("Case 6b: Overpayment di Tagihan Pertama Prorata (bayar 200k, prorata db 200k) → nextBillAmount harus 300k", async () => {
		// Pengecualian: Jika tagihan PERTAMA di-overpay (jarang terjadi), karena kita asumsi tagihan
		// pertama = jumlahBayar di DB (max hargaBlok), maka sistem menganggap "expect"nya ya 200k.
		// ke-1: Expected = 200k (karena jumlahBayar DB = 200k), lunas = 200k.
		// Kelebihan = 0.
		setupAdvanced(
			[
				{ pembayaranKe: 1, jumlahBayar: 200_000, lunas: true }, // admin input 200k
			],
			6,
			6,
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		// Limitasi tersisa: Overpayment di bill pertama akan "tertelan" jika prorata.
		expect(result.nextBillAmount).toBe(HARGA_BLOK);
	});

	// ── CASE 7: Murid Belum Bayar (BELUM_LUNAS) ───────────────────────────────
	it("Case 7: Murid belum bayar sama sekali (BELUM_LUNAS) → nextBillAmount harus 300k", async () => {
		setupAdvanced(
			[{ pembayaranKe: 1, jumlahBayar: HARGA_BLOK, lunas: false }],
			0,
			6,
		);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		// totalUangMasuk (LUNAS) = 0, totalDitagih = 300k
		// kelebihan = max(0, 0 - 300k) = 0 → next = 300k
		expect(result.nextBillAmount).toBe(HARGA_BLOK);
	});

	// ── CASE 8: Free Class (hargaKelas = 0) ───────────────────────────────────
	it("Case 8: Free class (hargaKelas = 0) → nextBillAmount = 0, needNewBill = false", async () => {
		// Override mock pendaftaran dengan hargaKelas = 0
		vi.mocked(mockDb.pendaftaranKelas.findUnique).mockResolvedValue({
			id: "p-1",
			kelasId: "kelas-1",
			muridId: "murid-1",
			tanggalMulai: "2024-01-01",
			isAktif: true,
			status: "AKTIF",
			createdAt: new Date(),
			updatedAt: new Date(),
			Kelas: {
				hargaKelas: 0, // FREE
				id: "kelas-1",
				kodeKelas: "KELAS-FREE",
				cabangId: "cabang-1",
				jenisKelasId: "jk-1",
				jenisKelasRel: { id: "jk-1", nama: "Free", tipe: "REGULAR" },
				legacyJenisKelas: null,
				legacyTipe: null,
				level: 1,
				grup: "A",
				bulanTahunAjar: "01/2024",
				deskripsi: null,
				cohortId: "cohort-1",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			murid: {
				id: "murid-1",
				namaLengkap: "Budi",
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
		} as unknown as Awaited<
			ReturnType<typeof mockDb.pendaftaranKelas.findUnique>
		>);

		vi.mocked(mockDb.pembayaran.findMany).mockResolvedValue([]);
		vi.mocked(mockDb.absensiMurid.count).mockResolvedValue(3);
		vi.mocked(mockDb.sesiPertemuanKelas.count).mockResolvedValue(6);

		const result = await calculateSisaPertemuan(mockDb, "p-1");

		expect(result.needNewBill).toBe(false);
		expect(result.nextBillAmount).toBe(0);
		expect(result.sisaPertemuan).toBe(999); // Unlimited
	});
});
