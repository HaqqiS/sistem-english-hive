import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
	try {
		const absensi = await prisma.absensiMurid.findMany({
			where: { muridId: "cmlewzzyh001jrr0lqsryrrsi" },
			include: {
				sesiPertemuanKelas: { include: { kelas: true } },
			},
		});

		console.log("Absensi lama siswa:");
		for (const a of absensi) {
			console.log(`--------------------------------------------------`);
			console.log(`ID Absensi: ${a.id}`);
			console.log(`- Kelas ID: ${a.sesiPertemuanKelas?.kelasId}`);
			console.log(`  Kode Kelas: ${a.sesiPertemuanKelas?.kelas?.kodeKelas}`);
			console.log(
				`  Sesi Ke: ${a.sesiPertemuanKelas?.id} (Waktu: ${a.sesiPertemuanKelas?.tanggalWaktu})`,
			);
		}
	} catch (err) {
		console.error(err);
	} finally {
		await prisma.$disconnect();
	}
}

run();
