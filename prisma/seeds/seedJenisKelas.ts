import { PrismaClient, TipeKelas } from "@prisma/client";

const prisma = new PrismaClient();

const REGULAR_TRACK = [
	{
		name: "TinyTods",
		price: 300000,
		type: TipeKelas.REGULAR,
		hargaBuku: 120000,
	},
	{
		name: "TinyStar",
		price: 300000,
		type: TipeKelas.REGULAR,
		hargaBuku: 120000,
	},
	{
		name: "PreLittleStar",
		price: 300000,
		type: TipeKelas.REGULAR,
		hargaBuku: 120000,
	},
	{
		name: "LittleStar",
		price: 300000,
		type: TipeKelas.REGULAR,
		hargaBuku: 120000,
	},
	{
		name: "RisingStar",
		price: 300000,
		type: TipeKelas.REGULAR,
		hargaBuku: 120000,
	},
	{
		name: "PreShiningStar",
		price: 400000,
		type: TipeKelas.REGULAR,
		hargaBuku: 120000,
	},
	{
		name: "ShiningStar",
		price: 400000,
		type: TipeKelas.REGULAR,
		hargaBuku: 120000,
	},
	{
		name: "Elementary",
		price: 400000,
		type: TipeKelas.REGULAR,
		hargaBuku: 120000,
	},
];

const PRIVATE_TRACK = [
	{
		name: "TinyTods",
		price: 800000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
	{
		name: "TinyStar",
		price: 800000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
	{
		name: "PreLittleStar",
		price: 800000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
	{
		name: "LittleStar",
		price: 800000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
	{
		name: "RisingStar",
		price: 800000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
	{
		name: "PreShiningStar",
		price: 800000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
	{
		name: "ShiningStar",
		price: 800000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
	{
		name: "Elementary",
		price: 800000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
];

const PRIVATE_DEWASA = [
	{
		name: "General / Dewasa",
		price: 1200000,
		type: TipeKelas.PRIVATE,
		hargaBuku: 120000,
	},
];

async function main() {
	console.log("Start seeding JenisKelas...");

	const cabangs = await prisma.cabang.findMany();
	if (cabangs.length === 0) {
		console.log("No Cabang found. Please seed Cabang first.");
		return;
	}

	// 1. Upsert All Classes
	const allGroups = [...REGULAR_TRACK, ...PRIVATE_TRACK, ...PRIVATE_DEWASA];

	for (const cabang of cabangs) {
		console.log(`Seeding for cabang: ${cabang.namaCabang}`);
		for (const item of allGroups) {
			await prisma.jenisKelasModel.upsert({
				where: {
					cabangId_tipe_nama: {
						cabangId: cabang.id,
						nama: item.name,
						tipe: item.type,
					},
				},
				update: {
					harga: item.price,
				},
				create: {
					nama: item.name,
					harga: item.price,
					tipe: item.type,
					cabangId: cabang.id,
				},
			});
		}
	}

	// 2. Link Progression (Next Level)
	// Helper to link a list in order
	const linkTrack = async (
		track: { name: string; price: number; type: TipeKelas }[],
		cabangId: string
	) => {
		for (let i = 0; i < track.length - 1; i++) {
			const currentItem = track[i];
			const nextItem = track[i + 1];
			if (!currentItem || !nextItem) continue;

			const currentName = currentItem.name;
			const currentType = currentItem.type;
			const nextName = nextItem.name;
			const nextType = nextItem.type;

			const current = await prisma.jenisKelasModel.findUnique({
				where: {
					cabangId_tipe_nama: {
						cabangId: cabangId,
						nama: currentName,
						tipe: currentType,
					},
				},
			});
			const next = await prisma.jenisKelasModel.findUnique({
				where: {
					cabangId_tipe_nama: {
						cabangId: cabangId,
						nama: nextName,
						tipe: nextType,
					},
				},
			});

			if (current && next) {
				await prisma.jenisKelasModel.update({
					where: { id: current.id },
					data: { nextLevelId: next.id },
				});
				console.log(
					`Linked ${currentName} (${currentType}) -> ${nextName} (${nextType}) for cabang ${cabangId}`,
				);
			}
		}
	};

	for (const cabang of cabangs) {
		await linkTrack(REGULAR_TRACK, cabang.id);
		await linkTrack(PRIVATE_TRACK, cabang.id);
	}

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
