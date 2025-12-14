import {
	StatusPembayaran,
	StatusAbsenMurid,
	type PrismaClient,
} from "@prisma/client";
import {
	JUMLAH_PERTEMUAN_PER_BLOK,
	BATAS_SISA_UNTUK_TAGIHAN,
	BATAS_SESI,
} from "@/constants/pembayaran";

// Definisi tipe kembalian agar TypeScript tidak bingung
type BillingStatus = {
	muridName: string;
	kodeKelas: string;
	totalKuotaSesi: number;
	totalTerpakai: number;
	sisaPertemuan: number;
	needNewBill: boolean;
	nextBillPembayaranKe: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	pendaftaranData: any;
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
			pendaftaranData: pendaftaran,
			hargaPerSesi: 0,
			paketPertemuan,
		};
	}

	// 2. HITUNG KREDIT (Total Sesi yang SUDAH DIBAYAR LUNAS)
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

	const totalKuotaSesi = Math.floor(totalUangMasuk / hargaPerSesi);

	// 3. HITUNG DEBIT (Total Sesi yang SUDAH DIGUNAKAN)
	const totalTerpakai = await db.absensiMurid.count({
		where: {
			muridId: pendaftaran.muridId,
			sesiPertemuanKelas: {
				kelasId: pendaftaran.kelasId,
			},
			status: {
				in: [StatusAbsenMurid.HADIR, StatusAbsenMurid.ALPA],
			},
		},
	});

	// 4. Kalkulasi Sisa
	const sisaPertemuan = totalKuotaSesi - totalTerpakai;

	// 5. Cek Trigger Tagihan
	let needNewBill = false;
	let nextBillPembayaranKe = 0;

	const allBills = await db.pembayaran.findMany({
		where: { pendaftaranKelasId: pendaftaranKelasId },
		select: { jumlahBayar: true, pembayaranKe: true },
	});

	const totalUangDitagih = allBills.reduce(
		(acc, curr) => acc + curr.jumlahBayar,
		0,
	);
	// totalKapasitasDitagih = 300k/ 50k
	// totalKapasitasDitagih = 6 sesi
	const totalKapasitasDitagih = Math.floor(totalUangDitagih / hargaPerSesi);

	// potensiSisa = 6 - totalTerpakai(3)
	// potensiSisa = 3 sesi
	const potensiSisa = totalKapasitasDitagih - totalTerpakai;

	if (potensiSisa <= BATAS_SISA_UNTUK_TAGIHAN) {
		needNewBill = true;

		// E. Tentukan urutan pembayaran berikutnya
		// Ambil angka terbesar yang ada, lalu tambah 1.
		// Ini aman untuk Late Joiner yang mungkin start dari pembayaranKe: 2.
		const maxPembayaranKe =
			allBills.length > 0
				? Math.max(...allBills.map((b) => b.pembayaranKe))
				: 0;

		nextBillPembayaranKe = maxPembayaranKe + 1;
	}

	// // Jika sisa pertemuan sudah sedikit (<= BATAS)
	// if (sisaPertemuan <= BATAS_SISA_UNTUK_TAGIHAN) {
	//   // --- LOGIKA BARU: CEK BERDASARKAN JUMLAH TAGIHAN YANG ADA ---

	//   // Hitung total tagihan yang SUDAH dibuat (baik Lunas maupun Belum)
	//   const totalTagihanDibuat = await db.pembayaran.count({
	//     where: { pendaftaranKelasId: pendaftaranKelasId },
	//   });

	//   // Hitung berapa paket yang SEHARUSNYA sudah ditagih agar bisa mengcover pemakaian saat ini + buffer 1 paket ke depan
	//   // Rumus: Jika pemakaian 6, butuh 1 paket (cover 1-8). Jika pemakaian 8, butuh 2 paket (biar ada sisa 8 lagi).
	//   // Tapi kita ingin mentrigger tagihan BARU (paket ke-N+1) saat sisa menipis.

	//   // Logika: "Apakah jumlah paket yang sudah ditagih CUKUP untuk menutupi pemakaian + 1 paket ke depan?"
	//   // Total kapasitas yang seharusnya dimiliki = totalTagihanDibuat * 8
	//   // Kita ingin men-trigger tagihan baru JIKA:
	//   // (Kapasitas yg dimiliki - Pemakaian) <= Batas
	//   // Tapi kapasitas yg dimiliki disini adalah berdasarkan TAGIHAN YANG ADA (bukan cuma yg lunas)

	//   const totalKapasitasTagihan = totalTagihanDibuat * paketPertemuan;
	//   const potensiSisa = totalKapasitasTagihan - totalTerpakai;

	//   // Jika potensi sisa (berdasarkan semua tagihan yg ada) sudah <= Batas, buat tagihan baru
	//   if (potensiSisa <= BATAS_SISA_UNTUK_TAGIHAN) {
	//     needNewBill = true;
	//     nextBillPembayaranKe = totalTagihanDibuat + 1;
	//   }
	// }

	return {
		muridName,
		kodeKelas,
		totalKuotaSesi,
		totalTerpakai,
		sisaPertemuan,
		needNewBill,
		nextBillPembayaranKe,
		pendaftaranData: pendaftaran,
		hargaPerSesi,
		paketPertemuan,
	};
};

export const generateTagihan = async (
	db: PrismaClient,
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
