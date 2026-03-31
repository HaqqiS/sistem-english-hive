import {
	type Prisma,
	type PrismaClient,
	StatusAbsenMurid,
	StatusPembayaran,
} from "@prisma/client";

import {
	BATAS_SESI,
	BATAS_SISA_UNTUK_TAGIHAN,
	JUMLAH_PERTEMUAN_PER_BLOK,
} from "@/constants/pembayaran";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

// Definisi tipe kembalian agar TypeScript tidak bingung
type PendaftaranWithRelations = Prisma.PendaftaranKelasGetPayload<{
	include: {
		Kelas: {
			select: { hargaKelas: true; id: true; kodeKelas: true };
		};
		murid: {
			select: { id: true; namaLengkap: true };
		};
	};
}>;

type BillingStatus = {
	muridName: string;
	kodeKelas: string;
	totalKuotaSesi: number;
	totalTerpakai: number;
	sisaPertemuan: number;
	needNewBill: boolean;
	nextBillPembayaranKe: number;
	nextBillAmount: number; // Nominal tagihan berikutnya (memperhitungkan kelebihan bayar)
	pendaftaranData: PendaftaranWithRelations;
	hargaPerSesi: number;
	paketPertemuan: number;
};

export const calculateSisaPertemuan = async (
	db: PrismaClient,
	pendaftaranKelasId: string,
): Promise<BillingStatus> => {
	// 1. Ambil Data Pendaftaran
	const pendaftaran = await db.pendaftaranKelas.findUnique({
		where: { id: pendaftaranKelasId },
		include: {
			Kelas: {
				select: { hargaKelas: true, id: true, kodeKelas: true },
			},
			murid: {
				select: { id: true, namaLengkap: true },
			},
		},
	});

	if (!pendaftaran) {
		throw new Error("Data pendaftaran tidak ditemukan");
	}

	// Pastikan nilai default aman
	const hargaPerSesi = pendaftaran.Kelas?.hargaKelas ?? 0;
	const kodeKelas = pendaftaran.Kelas?.kodeKelas ?? "Unknown Class";
	const muridName = pendaftaran.murid?.namaLengkap ?? "Unknown Student";
	const paketPertemuan = JUMLAH_PERTEMUAN_PER_BLOK;

	if (hargaPerSesi <= 0) {
		return {
			muridName,
			kodeKelas,
			totalKuotaSesi: 0,
			totalTerpakai: 0,
			sisaPertemuan: 999, // Unlimited
			needNewBill: false,
			nextBillPembayaranKe: 0,
			nextBillAmount: 0,
			pendaftaranData: pendaftaran,
			hargaPerSesi: 0,
			paketPertemuan,
		};
	}

	// 2. HITUNG KREDIT (Per-PendaftaranKelas) — hanya invoice kelas ini
	const pembayaranLunas = await db.pembayaran.findMany({
		where: {
			pendaftaranKelasId: pendaftaranKelasId,
			statusBayar: StatusPembayaran.LUNAS,
		},
		select: { jumlahBayar: true },
	});

	const totalUangMasuk = pembayaranLunas.reduce(
		(acc, curr) => acc + curr.jumlahBayar,
		0,
	);

	// 3. HITUNG DEBIT (Per-Kelas) — hanya sesi di kelas ini
	const totalTerpakai = await db.absensiMurid.count({
		where: {
			muridId: pendaftaran.muridId,
			sesiPertemuanKelas: { kelasId: pendaftaran.kelasId },
			status: {
				in: [StatusAbsenMurid.HADIR, StatusAbsenMurid.ALPA],
			},
		},
	});

	// 4. Kalkulasi Sisa (Per-Kelas — tidak ada perlu "virtual" calculation)
	// totalUangMasuk sudah terisolasi ke kelas ini, jadi langsung floor
	const totalKuotaSesi = Math.floor(totalUangMasuk / hargaPerSesi);
	const sisaPertemuan = Math.max(0, totalKuotaSesi - totalTerpakai);

	// 5. Cek Trigger Tagihan
	let needNewBill = false;
	let nextBillPembayaranKe = 0;

	const allBills = await db.pembayaran.findMany({
		where: { pendaftaranKelasId: pendaftaranKelasId },
		select: { jumlahBayar: true, pembayaranKe: true, statusBayar: true },
	});

	// --- A. LOGIKA UTAMA: BERDASARKAN SALDO (Prepaid System) ---
	const totalUangBelumLunas = allBills
		.filter((b) => b.statusBayar !== StatusPembayaran.LUNAS)
		.reduce((acc, curr) => acc + curr.jumlahBayar, 0);

	// Potensi sisa jika semua tagihan yang belum lunas juga dibayar
	const totalUangDitagihBerlaku = totalUangMasuk + totalUangBelumLunas;

	const totalKapasitasDitagih = Math.floor(
		totalUangDitagihBerlaku / hargaPerSesi,
	);
	const potensiSisa = totalKapasitasDitagih - totalTerpakai;

	// Trigger 1: Sisa Saldo Menipis
	if (potensiSisa <= BATAS_SISA_UNTUK_TAGIHAN) {
		needNewBill = true;
	}

	// --- B. LOGIKA SYNC: BERDASARKAN JADWAL KELAS (Hybrid System) ---
	// Tujuannya: Memaksa tagihan muncul jika kelas sudah berjalan jauh,
	// meskipun murid masih punya saldo (karena sering OFF/Cuti).

	// 1. Hitung berapa sesi kelas yang SUDAH berlalu sejak murid bergabung
	// (Kita ambil semua sesi kelas yang sudah lewat tanggalnya)
	const totalSesiKelasBerlalu = await db.sesiPertemuanKelas.count({
		where: {
			kelasId: pendaftaran.kelasId,
			tanggalWaktu: {
				lte: dayjs().tz(TIMEZONE_BISNIS).endOf("day").toDate(), // Sesi yang sudah lewat
			},
		},
	});

	// 2. Tentukan kita sekarang ada di "Blok" ke berapa?
	// Blok 1: Sesi 1-8 -> Trigger di Sesi 6
	// Blok 2: Sesi 9-16 -> Trigger di Sesi 14
	// Rumus: Sisa Sesi di Blok Ini <= BATAS (2)

	// Contoh: Sesi 6.
	// SesiDalamBlok = 6 % 8 = 6.
	// LastBlockEnd = ceil(6/8) * 8 = 8.
	// DistanceToEnd = 8 - 6 = 2. -> TRIGGER!

	const currentBlockNumber = Math.ceil(
		totalSesiKelasBerlalu / JUMLAH_PERTEMUAN_PER_BLOK,
	);
	const targetSesiAkhirBlok = currentBlockNumber * JUMLAH_PERTEMUAN_PER_BLOK;
	const distanceToBlockEnd = targetSesiAkhirBlok - totalSesiKelasBerlalu;

	// Cek apakah kita berada di zona trigger (2 sesi sebelum blok berakhir)
	// Note: totalSesiKelasBerlalu > 0 check is important to avoid trigger at 0
	if (
		totalSesiKelasBerlalu > 0 &&
		distanceToBlockEnd <= BATAS_SISA_UNTUK_TAGIHAN
	) {
		// Logika: Kita mengharapkan murid SUDAH membayar tagihan untuk Blok Berikutnya (N+1).
		// Blok 1 selesai -> Butuh Tagihan ke-2.
		// Blok 2 selesai -> Butuh Tagihan ke-3.

		const targetPembayaranKe = currentBlockNumber + 1;

		// Cek apakah murid sudah punya tagihan level itu?
		const maxPembayaranKe =
			allBills.length > 0
				? Math.max(...allBills.map((b) => b.pembayaranKe))
				: 0;

		if (maxPembayaranKe < targetPembayaranKe) {
			needNewBill = true;
		}
	}

	// --- FINALIZATION ---
	if (needNewBill) {
		const maxPembayaranKe =
			allBills.length > 0
				? Math.max(...allBills.map((b) => b.pembayaranKe))
				: 0;
		nextBillPembayaranKe = maxPembayaranKe + 1;
	}

	// --- HITUNG NOMINAL TAGIHAN BERIKUTNYA ---
	// PERHATIAN: Admin sering mengedit jumlahBayar = nominal aktual yang dibayar murid
	// (misal tagihan 300k murid tf 420k -> DB diedit jadi 420k).
	// Jika kita hanya sum(jumlahBayar) dari DB, totalDitagih = 420k, maka kelebihan = 0 (SALAH).
	// Solusi: Hitung Tagihan yang SEHARUSNYA ditarik (Expected):
	// - Tagihan Pertama Murid: Bisa jadi Prorata atau > 1 blok (jika very late join). Ambil jumlahBayar asli dari DB.
	// - Tagihan Selanjutnya: Beban murni SELALU seharga 1 blok penuh.
	const hargaBlok = hargaPerSesi * paketPertemuan;

	const minPembayaranKe =
		allBills.length > 0 ? Math.min(...allBills.map((b) => b.pembayaranKe)) : 0;

	const totalExpectedDitagih = allBills.reduce((acc, curr) => {
		if (curr.pembayaranKe === minPembayaranKe) {
			if (minPembayaranKe === 1) {
				// Jika tagihan pertama murid adalah pembayaranKe=1 (masuk di awal/tengah blok 1),
				// MAKSIMAL beban rasionalnya adalah 1 blok (opsi prorata < 1 blok).
				// Jika bayar > 1 blok (misal 480k), PASTI OVERPAYMENT murni.
				return acc + Math.min(curr.jumlahBayar, hargaBlok);
			} else {
				// Jika murid baru masuk di blok > 1 (Late Join Middle/Very Late),
				// tagihan awalnya bisa akumulasi beban dari sesi lalu (bisa > hargaBlok).
				// Kita percayakan jumlahBayar aktual dari DB.
				return acc + curr.jumlahBayar;
			}
		}
		// Tagihan ke-2 dst: Selalu expected 1 blok penuh.
		return acc + hargaBlok;
	}, 0);

	const kelebihanBayar = Math.max(0, totalUangMasuk - totalExpectedDitagih);
	const nextBillAmount =
		kelebihanBayar > 0 ? Math.max(0, hargaBlok - kelebihanBayar) : hargaBlok;

	return {
		muridName,
		kodeKelas,
		totalKuotaSesi,
		totalTerpakai,
		sisaPertemuan,
		needNewBill,
		nextBillPembayaranKe,
		nextBillAmount,
		pendaftaranData: pendaftaran,
		hargaPerSesi,
		paketPertemuan,
	};
};

export const generateTagihan = async (
	db: PrismaClient | Prisma.TransactionClient,
	params: {
		pendaftaranId: string;
		pembayaranKe: number;
		jumlahBayar: number;
		jatuhTempo: Date;
		note: string;
	},
) => {
	const exists = await db.pembayaran.findFirst({
		where: {
			pendaftaranKelasId: params.pendaftaranId,
			pembayaranKe: params.pembayaranKe,
		},
	});

	if (exists) return exists;

	return db.pembayaran.create({
		data: {
			pendaftaranKelasId: params.pendaftaranId,
			pembayaranKe: params.pembayaranKe,
			jumlahBayar: params.jumlahBayar,
			tanggalJatuhTempo: params.jatuhTempo,
			statusBayar: StatusPembayaran.BELUM_LUNAS,
			note: params.note,
		},
	});
};

/**
 * Menghitung tagihan awal untuk pendaftaran baru, termasuk logika Late Joiner.
 */
export const calculateInitialBill = (
	hargaPerSesi: number,
	jumlahSesiBerlalu: number,
) => {
	const sesiMasuk = jumlahSesiBerlalu + 1;
	let targetSesiAkhir = 0;
	let note = "";
	let pembayaranKe = 1;

	// Validasi batas sesi
	if (sesiMasuk > BATAS_SESI) {
		throw new Error(
			`Kelas ini sudah selesai (Mencapai batas ${BATAS_SESI} sesi).`,
		);
	}

	// Logika Checkpoint Auto-Generate
	const checkpoint1 = JUMLAH_PERTEMUAN_PER_BLOK - BATAS_SISA_UNTUK_TAGIHAN; // 8 - 2 = 6
	const checkpoint2 = JUMLAH_PERTEMUAN_PER_BLOK * 2 - BATAS_SISA_UNTUK_TAGIHAN; // 16 - 2 = 14

	if (sesiMasuk <= checkpoint1) {
		// Masuk Sesi 1-6 -> Target Sesi 8
		targetSesiAkhir = JUMLAH_PERTEMUAN_PER_BLOK;
		note = `Tagihan Blok 1 (Sesi ${sesiMasuk} s.d ${targetSesiAkhir})`;
		pembayaranKe = 1;
	} else if (sesiMasuk <= checkpoint2) {
		// Masuk Sesi 7-14 -> Target Sesi 16
		targetSesiAkhir = JUMLAH_PERTEMUAN_PER_BLOK * 2;
		note = `Late Joiner Blok 2 (Sesi ${sesiMasuk} s.d ${targetSesiAkhir})`;
		pembayaranKe = 2;
	} else {
		// Masuk Sesi 15-24 -> Target Sesi 24
		targetSesiAkhir = BATAS_SESI;
		note = `Late Joiner Blok Akhir (Sesi ${sesiMasuk} s.d ${targetSesiAkhir})`;
		pembayaranKe = 3;
	}

	const jumlahSesiDibayar = targetSesiAkhir - jumlahSesiBerlalu;
	const totalTagihan = jumlahSesiDibayar * hargaPerSesi;

	return {
		totalTagihan,
		jumlahSesiDibayar,
		pembayaranKe,
		note,
		sesiMasuk,
	};
};
