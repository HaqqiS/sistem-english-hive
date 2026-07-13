import type { PrismaClient } from "@prisma/client";

export async function syncGuruPenerimaBukuForKelas(
	db: PrismaClient,
	kelasId: string,
	guruIds: string[],
) {
	const targetGuruIds = guruIds.filter(Boolean);
	const penerimaTerkait = await db.penerimaBuku.findMany({
		where: {
			OR: [
				{ kelasId },
				{
					murid: {
						pendaftaranKelases: {
							some: { kelasId, status: { not: "NON_AKTIF" } },
						},
					},
				},
			],
		},
		select: { id: true },
	});

	if (penerimaTerkait.length === 0) return;

	const penerimaIds = penerimaTerkait.map((p) => p.id);

	await db.penerimaBukuGuru.deleteMany({
		where: {
			penerimaBukuId: { in: penerimaIds },
			...(targetGuruIds.length > 0 ? { guruId: { notIn: targetGuruIds } } : {}),
		},
	});

	if (targetGuruIds.length === 0) return;

	await db.penerimaBukuGuru.createMany({
		data: penerimaIds.flatMap((penerimaBukuId) =>
			targetGuruIds.map((guruId) => ({ penerimaBukuId, guruId })),
		),
		skipDuplicates: true,
	});
}
