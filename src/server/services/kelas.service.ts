import type { PrismaClient } from "@prisma/client";
import {
	StatusKelas,
	StatusPembayaran,
	StatusPendaftaran,
} from "@prisma/client";
import { BATAS_SESI, JUMLAH_PERTEMUAN_PER_BLOK } from "@/constants/pembayaran";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";
import { TRPCError } from "@trpc/server";

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

	const newBulanTahun = currentClass.bulanTahunAjar;
	const oldKode = currentClass.kodeKelas;

	// Logic replace string kode kelas
	// Replace JenisKelas Name in string if changed (case-insensitive)
	let newKodeKelas = oldKode;

	const escapeRegExp = (str: string) =>
		str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const oldNameStr = `${currentClass.jenisKelasRel.nama} ${currentClass.level}`;
	const oldNameRegex = new RegExp(escapeRegExp(oldNameStr), "i");

	if (nextJenisKelasId !== currentClass.jenisKelasRel.id) {
		// Replace Old Name with New Name
		const newNameStr = `${nextJenisKelasNama} ${nextLevel}`.toUpperCase();
		newKodeKelas = newKodeKelas.replace(oldNameRegex, newNameStr);
	} else {
		// Just increment level
		const newNameStr =
			`${currentClass.jenisKelasRel.nama} ${nextLevel}`.toUpperCase();
		newKodeKelas = newKodeKelas.replace(oldNameRegex, newNameStr);
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
			statusKelas: StatusKelas.LEVEL_UP,
		},
	});

	const prevGurus = await tx.historyGuruKelas.findMany({
		where: { kelasId: currentClass.id, statusGuru: "ACTIVE" },
	});

	if (prevGurus.length > 0) {
		await tx.historyGuruKelas.createMany({
			data: prevGurus.map((pg) => ({
				kelasId: newKelas.id,
				guruId: pg.guruId,
				statusGuru: "ACTIVE",
				// mulaiPada will be set on handleClassCompletion
			})),
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
					status: StatusPendaftaran.AKTIF,
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
						deskripsi: "Belum Order",
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
			data: { status: StatusPendaftaran.NON_AKTIF },
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

		// Update Status Kelas Jadi COMPLETED, dan kelas baru jadi RUNNING
		const kelasLama = await tx.kelas.update({
			where: { id: kelasId },
			data: { statusKelas: "COMPLETED" },
			select: { cohortId: true, level: true },
		});

		await tx.kelas.updateMany({
			where: {
				cohortId: kelasLama.cohortId,
				level: { gt: kelasLama.level },
				statusKelas: "LEVEL_UP",
			},
			data: { statusKelas: "RUNNING" },
		});

		// Set mulaiPada Guru untuk kelas yang baru RUNNING
		const newRunningClasses = await tx.kelas.findMany({
			where: {
				cohortId: kelasLama.cohortId,
				level: { gt: kelasLama.level },
				statusKelas: "RUNNING",
			},
			select: { id: true },
		});

		if (newRunningClasses.length > 0) {
			await tx.historyGuruKelas.updateMany({
				where: {
					kelasId: { in: newRunningClasses.map((k) => k.id) },
					statusGuru: "ACTIVE",
					mulaiPada: null, // Hanya update yang belum diset
				},
				data: {
					mulaiPada: dayjs().add(1, "day").format("YYYY-MM-DD"),
				},
			});
		}

		return true; // Selesai
	}
	return false; // Belum selesai
};

/**
 * Core Service untuk membuat Sesi Pertemuan Kelas (Internal use in mutations)
 */
export const createSesiPertemuanCore = async (
	tx: PrismaTx,
	input: {
		kelasId: string;
		ruangId: string;
		tanggalWaktu: Date;
		jadwalKelasId?: string;
		isTeacher?: boolean; // Label for special logic (double session check)
	},
) => {
	const { kelasId, ruangId, tanggalWaktu, jadwalKelasId, isTeacher } = input;

	// 1. Validasi Kepemilikan & Konsistensi (Cabang)
	const [kelas, ruang] = await Promise.all([
		tx.kelas.findUnique({
			where: { id: kelasId },
			select: { cabangId: true, kodeKelas: true },
		}),
		tx.ruang.findUnique({
			where: { id: ruangId },
			select: { cabangId: true, namaRuang: true },
		}),
	]);

	if (!kelas || !ruang) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Kelas atau Ruang tidak ditemukan.",
		});
	}

	if (kelas.cabangId !== ruang.cabangId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Konflik Cabang: Kelas ${kelas.kodeKelas} dan Ruang ${ruang.namaRuang} berbeda cabang.`,
		});
	}

	// 2. Cek Total Sesi (Maksimal 24)
	const totalSesiSebelum = await tx.sesiPertemuanKelas.count({
		where: { kelasId: kelasId },
	});

	if (totalSesiSebelum >= BATAS_SESI) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Gagal membuat sesi: Kelas ini sudah mencapai batas maksimal ${BATAS_SESI} sesi.`,
		});
	}

	// 3. Double-Click Protection (Khusus Guru/Jadwal)
	if (isTeacher && jadwalKelasId) {
		const hariIniStart = dayjs(tanggalWaktu)
			.tz(TIMEZONE_BISNIS)
			.startOf("day")
			.toDate();
		const hariIniEnd = dayjs(tanggalWaktu)
			.tz(TIMEZONE_BISNIS)
			.endOf("day")
			.toDate();

		const sesiExistingHariIni = await tx.sesiPertemuanKelas.findFirst({
			where: {
				jadwalKelasId: jadwalKelasId,
				tanggalWaktu: {
					gte: hariIniStart,
					lte: hariIniEnd,
				},
			},
			select: { id: true },
		});

		if (sesiExistingHariIni) {
			// Perilaku "Toleran": Kembalikan sesi yang sudah ada
			return {
				sesi: sesiExistingHariIni,
				isExisting: true,
			};
		}
	}

	// 4. Create Sesi
	const newSesi = await tx.sesiPertemuanKelas.create({
		data: {
			kelasId,
			ruangId,
			tanggalWaktu,
			jadwalKelasId,
		},
	});

	// 5. Triggers
	const totalSesiSetelah = totalSesiSebelum + 1;

	// Level Up at Sesi 20
	if (totalSesiSetelah === 20) {
		// handleAutoLevelUp butuh 'jadwal' object. Jika tidak ada jadwalKelasId, kita buat mock minimal.
		await handleAutoLevelUp({
			tx,
			jadwal: {
				kelasId,
				ruangId,
				kelas: { id: kelasId },
			},
		});
	}

	return {
		sesi: newSesi,
		isExisting: false,
	};
};
