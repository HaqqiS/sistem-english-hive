import { PrismaClient, StatusPendaftaran } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Start migrating isAktif -> status...");

	// Update isAktif = true -> AKTIF
	const updatedAktif = await prisma.pendaftaranKelas.updateMany({
		where: { isAktif: true },
		data: { status: StatusPendaftaran.AKTIF, isAktif: null },
	});
	console.log(`Updated ${updatedAktif.count} records to AKTIF`);

	// Update isAktif = false -> NON_AKTIF
	const updatedNonAktif = await prisma.pendaftaranKelas.updateMany({
		where: { isAktif: false },
		data: { status: StatusPendaftaran.NON_AKTIF, isAktif: null },
	});
	console.log(`Updated ${updatedNonAktif.count} records to NON_AKTIF`);

	console.log("Migration done.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
