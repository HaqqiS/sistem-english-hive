import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
	const kelasId = process.argv[2];
	if (!kelasId) {
		console.error(
			"Harap masukkan ID Kelas sebagai argumen!\nContoh: pnpm tsx prisma/seeds/seed19Sesi.ts <kelasId>",
		);
		process.exit(1);
	}

	// 1. Dapatkan data kelas
	const kelas = await db.kelas.findUnique({
		where: { id: kelasId },
		include: {
			jadwalKelas: true,
			historyGuruKelases: {
				where: { statusGuru: "ACTIVE" },
			},
			pendaftaranKelases: {
				where: { status: "AKTIF" },
			},
		},
	});

	if (!kelas) {
		console.error(`Kelas dengan ID ${kelasId} tidak ditemukan.`);
		process.exit(1);
	}

	const jadwal = kelas.jadwalKelas[0];
	if (!jadwal) {
		console.error("Kelas ini belum memiliki jadwal.");
		process.exit(1);
	}

	const guruAktif = kelas.historyGuruKelases[0];
	if (!guruAktif) {
		console.error("Kelas ini belum memiliki guru aktif.");
		process.exit(1);
	}

	const muridAktif = kelas.pendaftaranKelases;
	if (muridAktif.length === 0) {
		console.warn(
			"Peringatan: Kelas ini tidak memiliki murid aktif, sesi tetap akan dibuat.",
		);
	}

	// Cek jika sudah ada sesi untuk kelas ini
	const existCount = await db.sesiPertemuanKelas.count({ where: { kelasId } });
	const toCreate = 19 - existCount;

	if (toCreate <= 0) {
		console.error(
			`Kelas ini sudah memiliki ${existCount} sesi. Tidak perlu seeding lebih lanjut.`,
		);
		process.exit(0);
	}

	console.log(
		`Memulai seeding ${toCreate} sesi untuk kelas ${kelas.kodeKelas}...`,
	);

	// Kita gunakan transaction agar aman (jika murid banyak bisa di-createMany manual diluar loop atau satu2)
	for (let i = 1; i <= toCreate; i++) {
		const sesiDate = new Date();
		// kita set tanggal mundur, agar sesi 1 terjadi 19 hari lalu dsb.
		sesiDate.setDate(sesiDate.getDate() - (toCreate - i + 1));

		const sesi = await db.sesiPertemuanKelas.create({
			data: {
				kelasId: kelas.id,
				ruangId: jadwal.ruangId,
				jadwalKelasId: jadwal.id,
				tanggalWaktu: sesiDate,
			},
		});

		await db.absensiGuru.create({
			data: {
				guruId: guruAktif.guruId,
				sesiPertemuanKelasId: sesi.id,
				status: "HADIR",
				isVerified: true,
			},
		});

		for (const murid of muridAktif) {
			await db.absensiMurid.create({
				data: {
					muridId: murid.muridId,
					sesiPertemuanKelasId: sesi.id,
					status: "HADIR",
				},
			});
		}

		console.log(
			`Sesi ke-${existCount + i} berhasil dibuat pada tanggal ${sesiDate.toISOString().split("T")[0]}`,
		);
	}

	console.log(
		"Seeding sesi berhasil! Sekarang Anda bisa mengetes sesi ke-20 via UI.",
	);
}

main()
	.catch((e) => {
		console.error("Terjadi error saat seeding:", e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
