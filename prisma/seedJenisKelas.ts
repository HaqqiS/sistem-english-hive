import { PrismaClient, TipeKelas } from "@prisma/client";

const prisma = new PrismaClient();

const REGULAR_TRACK = [
	{ name: "TinyTods", price: 300000, type: TipeKelas.REGULAR },
	{ name: "TinyStar", price: 300000, type: TipeKelas.REGULAR },
	{ name: "PreLittleStar", price: 300000, type: TipeKelas.REGULAR },
	{ name: "LittleStar", price: 300000, type: TipeKelas.REGULAR },
	{ name: "RisingStar", price: 300000, type: TipeKelas.REGULAR },
	{ name: "PreShiningStar", price: 400000, type: TipeKelas.REGULAR },
	{ name: "ShiningStar", price: 400000, type: TipeKelas.REGULAR },
	{ name: "Elementary", price: 400000, type: TipeKelas.REGULAR },
];

const PRIVATE_TRACK = [
	{ name: "Private TinyTods", price: 800000, type: TipeKelas.PRIVATE },
	{ name: "Private TinyStar", price: 800000, type: TipeKelas.PRIVATE },
	{ name: "Private PreLittleStar", price: 800000, type: TipeKelas.PRIVATE },
	{ name: "Private LittleStar", price: 800000, type: TipeKelas.PRIVATE },
	{ name: "Private RisingStar", price: 800000, type: TipeKelas.PRIVATE },
	{ name: "Private PreShiningStar", price: 800000, type: TipeKelas.PRIVATE },
	{ name: "Private ShiningStar", price: 800000, type: TipeKelas.PRIVATE },
	{ name: "Private Elementary", price: 800000, type: TipeKelas.PRIVATE },
];

const PRIVATE_DEWASA = [
	{ name: "Private General / Dewasa", price: 1200000, type: TipeKelas.PRIVATE },
];

async function main() {
	console.log("Start seeding JenisKelas...");

	// 1. Upsert All Classes
	const allGroups = [...REGULAR_TRACK, ...PRIVATE_TRACK, ...PRIVATE_DEWASA];

	for (const item of allGroups) {
		await prisma.jenisKelasModel.upsert({
			where: { nama: item.name },
			update: {
				harga: item.price,
				tipe: item.type,
			},
			create: {
				nama: item.name,
				harga: item.price,
				tipe: item.type,
			},
		});
	}

	// 2. Link Progression (Next Level)
	// Helper to link a list in order
	const linkTrack = async (
		track: { name: string; price: number; type: TipeKelas }[],
	) => {
		for (let i = 0; i < track.length - 1; i++) {
			const currentItem = track[i];
			const nextItem = track[i + 1];
			if (!currentItem || !nextItem) continue;

			const currentName = currentItem.name;
			const nextName = nextItem.name;

			const current = await prisma.jenisKelasModel.findUnique({
				where: { nama: currentName },
			});
			const next = await prisma.jenisKelasModel.findUnique({
				where: { nama: nextName },
			});

			if (current && next) {
				await prisma.jenisKelasModel.update({
					where: { id: current.id },
					data: { nextLevelId: next.id },
				});
				console.log(`Linked ${currentName} -> ${nextName}`);
			}
		}
	};

	await linkTrack(REGULAR_TRACK);
	await linkTrack(PRIVATE_TRACK);

	// Private Dewasa usually has no next level in this basic set

	console.log("Seeding JenisKelas completed.");
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
