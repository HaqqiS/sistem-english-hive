import { PrismaClient, TipeKelas } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Starting Data Migration (Legacy Enum -> Relational ID)...");

	// 1. Fetch all classes needing migration
	// Note: We access legacyJenisKelas via 'jenisKelas' map if possible,
	// but Prisma client allows access via field name 'legacyJenisKelas'
	const classes = await prisma.kelas.findMany({
		where: {
			// jenisKelasId: null,
			NOT: {
				legacyJenisKelas: null,
			},
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
		const targetName = k.legacyJenisKelas as string;

		// Map legacy Tipe to new enum TipeKelas if needed, assuming direct mapping
		// The seed data has TipeKelas.REGULAR and TipeKelas.PRIVATE
		// k.legacyTipe matches the enum values string-wise?
		// legacyTipe is likely 'REGULAR' or 'PRIVATE'

		let targetType: TipeKelas = TipeKelas.REGULAR;
		if (k.legacyTipe === "PRIVATE") {
			targetType = TipeKelas.PRIVATE;
		}

		// Find Master Data
		const master = await prisma.jenisKelasModel.findUnique({
			where: {
				tipe_nama: {
					nama: targetName,
					tipe: targetType,
				},
			},
		});

		// Fallback not really needed if seed is correct, but keeping structure if needed
		// Removing the old logic that tried to find "Private TinyTods" by name

		if (master) {
			await prisma.kelas.update({
				where: { id: k.id },
				data: {
					jenisKelasId: master.id,
					legacyJenisKelas: null,
					legacyTipe: null,
				},
			});
			successCount++;
		} else {
			console.error(
				`Could not find Master Data for '${targetName}' (Type: ${targetType}) (Original: ${k.legacyJenisKelas}, Tipe: ${k.legacyTipe}) (Class: ${k.kodeKelas}).`,
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
