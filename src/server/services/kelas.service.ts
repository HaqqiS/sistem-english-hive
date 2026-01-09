import type { PrismaClient } from "@prisma/client";
import { StatusPembayaran, StatusPendaftaran } from "@prisma/client";
import { BATAS_SESI, JUMLAH_PERTEMUAN_PER_BLOK } from "@/constants/pembayaran";
import dayjs from "@/utils/dateUtils";

// Tipe untuk Transaksi Prisma (agar bisa dipakai di dalam tx)
type PrismaTx = Omit<
	PrismaClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface HandleLevelUpParams {
	tx: PrismaTx; // Menerima transaction client
	jadwal: {
		kelasId: string;
		ruangId: string;
		kelas?: {
			id: string;
		};
	};
}

/**
 * Menangani logika Auto-Generate Level Baru (Trigger di Sesi 20)
 */
export const handleAutoLevelUp = async ({
	tx,
	jadwal,
}: HandleLevelUpParams) => {
	// 1. Fetch Class + Master Data Relation
	const currentClass = await tx.kelas.findUnique({
		where: { id: jadwal.kelas?.id || jadwal.kelasId },
		include: { jenisKelasRel: { include: { nextLevel: true } } },
	});

	if (!currentClass || !currentClass.jenisKelasRel) {
		console.error("Data kelas atau Master JenisKelas tidak ditemukan.");
		return null;
	}

	// Determine next level and class type
	let nextLevel = currentClass.level + 1;
	let nextJenisKelasId = currentClass.jenisKelasRel.id;
	let nextJenisKelasNama = currentClass.jenisKelasRel.nama;
	let nextJenisKelasHarga = currentClass.jenisKelasRel.harga;

	if (currentClass.level >= 4) {
		// Check progression from DB
		if (!currentClass.jenisKelasRel.nextLevel) {
			console.log(
				"Sudah mencapai level max dan tidak ada program lanjutan (DB).",
			);
			return null;
		}

		nextLevel = 1;
		nextJenisKelasId = currentClass.jenisKelasRel.nextLevel.id;
		nextJenisKelasNama = currentClass.jenisKelasRel.nextLevel.nama;
		nextJenisKelasHarga = currentClass.jenisKelasRel.nextLevel.harga;
	}

	// Cek apakah kelas tujuan sudah ada
	const existingClass = await tx.kelas.findFirst({
		where: {
			cohortId: currentClass.cohortId,
			jenisKelasId: nextJenisKelasId,
			level: nextLevel,
		},
	});
	if (existingClass) {
		console.log("Kelas level selanjutnya sudah ada, skip pembuatan.");
		return existingClass;
	}

	const newBulanTahun = dayjs().format("MM/YYYY");
	const oldKode = currentClass.kodeKelas;

	// Logic replace string kode kelas
	// Replace JenisKelas Name in string if changed
	let newKodeKelas = oldKode;

	if (nextJenisKelasId !== currentClass.jenisKelasRel.id) {
		// Replace Old Name with New Name
		newKodeKelas = newKodeKelas.replace(
			`${currentClass.jenisKelasRel.nama} ${currentClass.level}`,
			`${nextJenisKelasNama} ${nextLevel}`,
		);
	} else {
		// Just increment level
		newKodeKelas = newKodeKelas.replace(
			`${currentClass.jenisKelasRel.nama} ${currentClass.level}`,
			`${currentClass.jenisKelasRel.nama} ${nextLevel}`,
		);
	}

	newKodeKelas = newKodeKelas.replace(
		/\|\s\d{2}\/\d{4}$/,
		`| ${newBulanTahun}`,
	);

	// Create New Class using Master Data Price
	const newKelas = await tx.kelas.create({
		data: {
			jenisKelasId: nextJenisKelasId,
			level: nextLevel,
			grup: currentClass.grup,
			// tipe is inherited from Master, but if Schema removed it from Kelas, we don't need to set it.
			bulanTahunAjar: newBulanTahun,
			hargaKelas: nextJenisKelasHarga, // Use New Price!
			deskripsi: currentClass.deskripsi,
			kodeKelas: newKodeKelas,
			cohortId: currentClass.cohortId,
			cabangId: currentClass.cabangId,
		},
	});

	const prevGuru = await tx.historyGuruKelas.findFirst({
		where: { kelasId: currentClass.id, statusGuru: "ACTIVE" },
	});

	if (prevGuru) {
		await tx.historyGuruKelas.create({
			data: {
				kelasId: newKelas.id,
				guruId: prevGuru.guruId,
				statusGuru: "ACTIVE",
				mulaiPada: dayjs().add(2, "week").format("YYYY-MM-DD"),
			},
		});
	}

	// B. Copy Jadwal Kelas Lama ke Kelas Baru
	const oldJadwals = await tx.jadwalKelas.findMany({
		where: { kelasId: currentClass.id },
	});

	if (oldJadwals.length > 0) {
		const jadwalData = oldJadwals.map((old) => ({
			kelasId: newKelas.id,
			ruangId: old.ruangId,
			hari: old.hari,
			jamSlotTetapId: old.jamSlotTetapId,
			jamSlotCustomId: old.jamSlotCustomId,
		}));

		await tx.jadwalKelas.createMany({
			data: jadwalData,
		});
	}
	// C. Pindahkan Murid Aktif
	const activeStudents = await tx.pendaftaranKelas.findMany({
		where: { kelasId: currentClass.id, status: StatusPendaftaran.AKTIF }, // UPDATED: isAktif is deprecated
	});

	const totalTagihan = newKelas.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;
	const estimasiMulai = dayjs().add(2, "week").toDate();
	const estimasiMulaiString = dayjs(estimasiMulai).format("YYYY-MM-DD");

	// Determine next class book price
	const nextJenisKelasObject =
		nextJenisKelasId === currentClass.jenisKelasRel.id
			? currentClass.jenisKelasRel
			: currentClass.jenisKelasRel.nextLevel;

	// Fallback safely if something is wrong with relations, though logic above handles it
	const hargaBuku = nextJenisKelasObject
		? (nextJenisKelasObject.hargaBuku ?? 0)
		: 0;

	await Promise.all(
		activeStudents.map(async (student) => {
			const newReg = await tx.pendaftaranKelas.create({
				data: {
					muridId: student.muridId,
					kelasId: newKelas.id,
					tanggalMulai: estimasiMulaiString,
					isAktif: true,
				},
			});

			// 1. Tagihan SPP
			await tx.pembayaran.create({
				data: {
					pendaftaranKelasId: newReg.id,
					pembayaranKe: 1,
					jumlahBayar: totalTagihan,
					tanggalJatuhTempo: estimasiMulai,
					statusBayar: StatusPembayaran.PENDING,
					note: "Auto-Generate Level Up (Menunggu Konfirmasi)",
				},
			});

			// 2. Tagihan Buku (Jika ada harganya)
			if (hargaBuku > 0) {
				await tx.tagihanLain.create({
					data: {
						muridId: student.muridId,
						kategori: "BUKU",
						judul: `Buku ${nextJenisKelasNama} Level ${nextLevel}`,
						jumlah: hargaBuku,
						status: StatusPembayaran.BELUM_LUNAS,
						kelasId: newKelas.id,
					},
				});
			}
		}),
	);

	return newKelas;
};

/**
 * Menangani penutupan kelas lama (Trigger di Sesi 24)
 */
export const handleClassCompletion = async (
	tx: PrismaTx,
	kelasId: string,
	totalSesi: number,
) => {
	if (totalSesi >= BATAS_SESI) {
		console.log(`[AUTO-FINISH] Menutup kelas ID ${kelasId}`);

		// Matikan Pendaftaran Lama
		await tx.pendaftaranKelas.updateMany({
			where: { kelasId: kelasId },
			data: { isAktif: false },
		});

		// Hapus Jadwal Lama
		await tx.jadwalKelas.deleteMany({
			where: { kelasId: kelasId },
		});

		// Set Guru History jadi INACTIVE
		await tx.historyGuruKelas.updateMany({
			where: { kelasId: kelasId, statusGuru: "ACTIVE" },
			data: {
				statusGuru: "INACTIVE",
				selesaiPada: dayjs().format("YYYY-MM-DD"),
			},
		});

		return true; // Selesai
	}
	return false; // Belum selesai
};
