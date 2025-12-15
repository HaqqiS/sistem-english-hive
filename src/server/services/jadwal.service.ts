import type { Hari, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

// Tipe untuk Transaksi Prisma
type PrismaTx = Omit<
	PrismaClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface CreateJadwalParams {
	tx: PrismaTx;
	input: {
		kelasId: string;
		ruangId: string;
		hari: Hari;
		tipeJam: "TETAP" | "CUSTOM";
		jamMulai?: string;
		jamSelesai?: string;
		jamSlotTetapId?: string;
	}[];
	allowedCabangId: string | null;
}

interface UpdateJadwalParams {
	tx: PrismaTx;
	id: string;
	input: {
		kelasId: string;
		ruangId: string;
		hari: Hari;
		tipeJam: "TETAP" | "CUSTOM";
		jamMulai?: string;
		jamSelesai?: string;
		jamSlotTetapId?: string;
	};
	allowedCabangId: string | null;
}

/**
 * Service untuk menangani logika JadwalKelas yang kompleks (Validation, Collision Check, Transaction)
 */

export const createBulkJadwal = async ({
	tx,
	input,
	allowedCabangId,
}: CreateJadwalParams) => {
	// Pre-fetch Data Reference untuk Validasi Bulk (Optimization)
	const kelasIds = [...new Set(input.map((i) => i.kelasId))];
	const ruangIds = [...new Set(input.map((i) => i.ruangId))];
	const slotTetapIds = [
		...new Set(input.map((i) => i.jamSlotTetapId).filter(Boolean) as string[]),
	];

	const [allKelas, allRuang, allSlotTetap] = await Promise.all([
		tx.kelas.findMany({
			where: { id: { in: kelasIds } },
			select: { id: true, cabangId: true, kodeKelas: true },
		}),
		tx.ruang.findMany({
			where: { id: { in: ruangIds } },
			select: { id: true, cabangId: true, namaRuang: true },
		}),
		tx.jamSlotTetap.findMany({
			where: { id: { in: slotTetapIds } },
		}),
	]);

	const kelasMap = new Map(allKelas.map((k) => [k.id, k]));
	const ruangMap = new Map(allRuang.map((r) => [r.id, r]));
	const slotMap = new Map(allSlotTetap.map((s) => [s.id, s]));

	const createdSchedules = [];

	for (const scheduleData of input) {
		const { kelasId, ruangId, hari, tipeJam } = scheduleData;

		const kelas = kelasMap.get(kelasId);
		const ruang = ruangMap.get(ruangId);

		if (!kelas || !ruang) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Kelas atau Ruang tidak ditemukan.",
			});
		}

		if (kelas.cabangId !== ruang.cabangId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Konflik Data: Kelas ${kelas.kodeKelas} dan Ruang ${ruang.namaRuang} berbeda cabang.`,
			});
		}

		// Validasi Akses Cabang
		if (allowedCabangId && kelas.cabangId !== allowedCabangId) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Anda tidak berhak membuat jadwal di cabang lain.",
			});
		}

		let jamSlotCustomId: string | undefined;
		let jamSlotTetapId: string | undefined;
		let checkJamMulai = "";
		let checkJamSelesai = "";

		if (tipeJam === "CUSTOM") {
			const { jamMulai, jamSelesai } = scheduleData;

			if (!jamMulai || !jamSelesai) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Jam Mulai dan Selesai wajib diisi untuk jadwal Custom.",
				});
			}
			checkJamMulai = jamMulai;
			checkJamSelesai = jamSelesai;

			const existingJamCustom = await tx.jamSlotCustom.findFirst({
				where: { jamMulai, jamSelesai },
			});

			if (existingJamCustom) {
				jamSlotCustomId = existingJamCustom.id;
			} else {
				const newJamCustom = await tx.jamSlotCustom.create({
					data: { jamMulai, jamSelesai },
				});
				jamSlotCustomId = newJamCustom.id;
			}
		} else if (tipeJam === "TETAP") {
			jamSlotTetapId = scheduleData.jamSlotTetapId;
			if (!jamSlotTetapId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Slot Jam Tetap wajib diisi.",
				});
			}

			const slot = slotMap.get(jamSlotTetapId);

			if (!slot) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Slot Jam tidak ditemukan.",
				});
			}

			if (slot.cabangId !== ruang.cabangId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Konflik Cabang: Ruang dan Slot Jam tidak cocok.`,
				});
			}

			checkJamMulai = slot.jamMulai;
			checkJamSelesai = slot.jamSelesai;
		}

		// Collision Check
		const conflictingSchedule = await tx.jadwalKelas.findFirst({
			where: {
				hari: hari,
				ruangId: ruangId,
				OR: [
					{
						jamSlotTetap: {
							jamMulai: { lt: checkJamSelesai },
							jamSelesai: { gt: checkJamMulai },
						},
					},
					{
						jamSlotCustom: {
							jamMulai: { lt: checkJamSelesai },
							jamSelesai: { gt: checkJamMulai },
						},
					},
				],
			},
			include: {
				kelas: { select: { kodeKelas: true } },
			},
		});

		if (conflictingSchedule) {
			throw new TRPCError({
				code: "CONFLICT",
				message: `Bentrok Jadwal! Ruang ini sudah dipakai oleh kelas ${conflictingSchedule.kelas.kodeKelas} pada jam yang beririsan di hari ${hari}.`,
			});
		}

		const createdJadwal = await tx.jadwalKelas.create({
			data: {
				kelasId: kelasId,
				ruangId: ruangId,
				hari: hari,
				jamSlotTetapId: jamSlotTetapId,
				jamSlotCustomId: jamSlotCustomId,
			},
		});

		createdSchedules.push(createdJadwal);
	}

	return createdSchedules;
};

export const updateJadwal = async ({
	tx,
	id,
	input,
	allowedCabangId,
}: UpdateJadwalParams) => {
	const { kelasId, ruangId, hari, tipeJam } = input;

	const existingJadwal = await tx.jadwalKelas.findUnique({
		where: { id },
		include: { kelas: { select: { cabangId: true } } },
	});

	if (!existingJadwal) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Jadwal tidak ditemukan.",
		});
	}

	if (allowedCabangId && existingJadwal.kelas.cabangId !== allowedCabangId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Anda tidak berhak mengubah jadwal dari cabang lain.",
		});
	}

	const [kelasBaru, ruangBaru] = await Promise.all([
		tx.kelas.findUnique({
			where: { id: kelasId },
			select: { cabangId: true, kodeKelas: true },
		}),
		tx.ruang.findUnique({
			where: { id: ruangId },
			select: { cabangId: true, namaRuang: true },
		}),
	]);

	if (!kelasBaru || !ruangBaru) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Kelas atau Ruang tujuan tidak ditemukan.",
		});
	}

	if (kelasBaru.cabangId !== ruangBaru.cabangId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Konflik Data: Kelas ${kelasBaru.kodeKelas} dan Ruang ${ruangBaru.namaRuang} berbeda cabang.`,
		});
	}

	if (allowedCabangId && kelasBaru.cabangId !== allowedCabangId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Anda tidak berhak memindahkan jadwal ke cabang lain.",
		});
	}

	let jamSlotCustomId: string | null = null;
	let jamSlotTetapId: string | null = null;
	let checkJamMulai = "";
	let checkJamSelesai = "";

	if (tipeJam === "CUSTOM") {
		const { jamMulai, jamSelesai } = input;

		if (!jamMulai || !jamSelesai) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Jam Mulai dan Selesai wajib diisi untuk jadwal Custom.",
			});
		}

		checkJamMulai = jamMulai;
		checkJamSelesai = jamSelesai;

		const existingJamCustom = await tx.jamSlotCustom.findFirst({
			where: { jamMulai, jamSelesai },
		});

		if (existingJamCustom) {
			jamSlotCustomId = existingJamCustom.id;
		} else {
			const newJamCustom = await tx.jamSlotCustom.create({
				data: { jamMulai, jamSelesai },
			});
			jamSlotCustomId = newJamCustom.id;
		}
	} else {
		jamSlotTetapId = input.jamSlotTetapId ?? null;
		if (!jamSlotTetapId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Slot Jam Tetap wajib diisi.",
			});
		}

		const slot = await tx.jamSlotTetap.findUnique({
			where: { id: jamSlotTetapId },
		});

		if (!slot) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Slot Jam Tetap tidak ditemukan.",
			});
		}

		if (slot.cabangId !== ruangBaru.cabangId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Slot Jam Tetap tidak valid untuk cabang ini.",
			});
		}

		checkJamMulai = slot.jamMulai;
		checkJamSelesai = slot.jamSelesai;
	}

	const conflictingSchedule = await tx.jadwalKelas.findFirst({
		where: {
			hari: hari,
			ruangId: ruangId,
			id: { not: id },
			OR: [
				{
					jamSlotTetap: {
						jamMulai: { lt: checkJamSelesai },
						jamSelesai: { gt: checkJamMulai },
					},
				},
				{
					jamSlotCustom: {
						jamMulai: { lt: checkJamSelesai },
						jamSelesai: { gt: checkJamMulai },
					},
				},
			],
		},
		include: {
			kelas: { select: { kodeKelas: true } },
		},
	});

	if (conflictingSchedule) {
		throw new TRPCError({
			code: "CONFLICT",
			message: `Bentrok! Ruang ini sudah dipakai kelas ${conflictingSchedule.kelas.kodeKelas} pada jam tersebut.`,
		});
	}

	return await tx.jadwalKelas.update({
		where: { id },
		data: {
			kelasId,
			ruangId,
			hari,
			jamSlotTetapId: jamSlotTetapId,
			jamSlotCustomId: jamSlotCustomId,
		},
	});
};
