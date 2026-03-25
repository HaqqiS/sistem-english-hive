import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
	try {
		const murid = await prisma.murid.findUnique({
			where: { id: "cmkrrtd0r000dlw0l7g9c8xlb" },
		});

		if (!murid) {
			console.log("Murid tidak ditemukan");
			return;
		}

		const absensi = await prisma.absensiMurid.findMany({
			where: { muridId: murid.id },
			include: {
				sesiPertemuanKelas: { include: { kelas: true } },
			},
		});

		const pendaftaran = await prisma.pendaftaranKelas.findMany({
			where: { muridId: murid.id },
			include: { Kelas: true },
		});

		const pembayaran = await prisma.pembayaran.findMany({
			where: { pendaftaranKelas: { muridId: murid.id } },
		});

		const tagihanBuku = await prisma.tagihanLain.findMany({
			where: { muridId: murid.id },
		});

		console.log(
			JSON.stringify(
				{
					nama: murid.namaLengkap,
					absensi: absensi.map((a) => ({
						id: a.id,
						idKelas: a.sesiPertemuanKelas?.kelasId,
						harga: a.sesiPertemuanKelas?.kelas?.hargaKelas,
						status: a.status,
					})),
					pendaftaran: pendaftaran.map((p) => ({
						idKelas: p.kelasId,
						status: p.status,
						harga: p.Kelas?.hargaKelas,
					})),
					pembayaranLunas: pembayaran
						.filter((p) => p.statusBayar === "LUNAS")
						.map((p) => p.jumlahBayar),
					tagihanBuku: tagihanBuku.map((t) => ({
						nominal: t.jumlah,
						status: t.status,
					})),
				},
				null,
				2,
			),
		);
	} catch (err) {
		console.error(err);
	} finally {
		await prisma.$disconnect();
	}
}

run();
