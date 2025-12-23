import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Starting Data Migration (Legacy Enum -> Relational ID)...");

	// 1. Fetch all classes needing migration
	// Note: We access legacyJenisKelas via 'jenisKelas' map if possible,
	// but Prisma client allows access via field name 'legacyJenisKelas'
	const classes = await prisma.kelas.findMany({
		where: {
			jenisKelasId: null,
		},
		select: {
			id: true,
			kodeKelas: true,
			legacyJenisKelas: true,
			legacyTipe: true,
		},
	});

	console.log(`Found ${classes.length} classes to migrate.`);

	let successCount = 0;
	let failCount = 0;

	for (const k of classes) {
		if (!k.legacyJenisKelas) {
			console.warn(
				`Class ${k.kodeKelas} (ID: ${k.id}) has no legacyJenisKelas. Skipping.`,
			);
			continue;
		}

		// Construct Target Name
		let targetName = k.legacyJenisKelas as string;
		if (k.legacyTipe === "PRIVATE") {
			// Try "Private TinyTods"
			targetName = `Private ${targetName}`;
		}

		// Find Master Data
		let master = await prisma.jenisKelasModel.findUnique({
			where: { nama: targetName },
		});

		// Fallback: If "Private TinyTods" not found, maybe it was just "TinyTods" (misconfig?)
		if (!master && k.legacyTipe === "PRIVATE") {
			master = await prisma.jenisKelasModel.findUnique({
				where: { nama: k.legacyJenisKelas as string },
			});
		}

		if (master) {
			await prisma.kelas.update({
				where: { id: k.id },
				data: { jenisKelasId: master.id },
			});
			successCount++;
		} else {
			console.error(
				`Could not find Master Data for '${targetName}' (Original: ${k.legacyJenisKelas}, Tipe: ${k.legacyTipe}) (Class: ${k.kodeKelas}).`,
			);
			failCount++;
		}
	}

	console.log(
		`Migration Completed. Success: ${successCount}, Failed: ${failCount}.`,
	);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
