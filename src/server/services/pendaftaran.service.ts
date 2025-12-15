import {
	type PrismaClient,
	StatusMurid,
	StatusPembayaran,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { JUMLAH_PERTEMUAN_PER_BLOK } from "@/constants/pembayaran";
import { calculateInitialBill } from "@/server/services/pembayaran.service";

// Tipe untuk Transaksi Prisma
type PrismaTx = Omit<
	PrismaClient,
	"$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface CreatePendaftaranParams {
	tx: PrismaTx;
	input: {
		muridId: string;
		kelasId: string;
		tanggalMulai: string;
		isAktif?: boolean;
	};
	kelas: {
		hargaKelas: number;
		cohortId: string;
		level: number;
	};
	jumlahSesiBerlalu: number;
}

interface CreateBulkPendaftaranParams {
	tx: PrismaTx;
	input: {
		muridIds: string[];
		kelasId: string;
		tanggalMulai: string;
	};
	kelas: {
		hargaKelas: number;
		cohortId: string;
		level: number;
	};
	jumlahSesiBerlalu: number;
}

export const createPendaftaran = async ({
	tx,
	input,
	kelas,
	jumlahSesiBerlalu,
}: CreatePendaftaranParams) => {
	// 1. Kalkulasi Tagihan
	let billInfo: ReturnType<typeof calculateInitialBill>;
	try {
		billInfo = calculateInitialBill(kelas.hargaKelas, jumlahSesiBerlalu);
	} catch (error) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				error instanceof Error ? error.message : "Gagal menghitung tagihan",
		});
	}

	// A. Create Pendaftaran Utama
	const pendaftaran = await tx.pendaftaranKelas.create({
		data: {
			...input,
			isAktif: true,
		},
	});

	// B. Create Tagihan Utama
	await tx.pembayaran.create({
		data: {
			pendaftaranKelasId: pendaftaran.id,
			pembayaranKe: billInfo.pembayaranKe,
			jumlahBayar: billInfo.totalTagihan,
			tanggalJatuhTempo: dayjs(input.tanggalMulai).toDate(),
			statusBayar: StatusPembayaran.BELUM_LUNAS,
			note: billInfo.note,
		},
	});

	// C. CEK "VERY LATE JOINER" (Sesi 21-24)
	let nextLevelRegistrationId: string | null = null;

	if (billInfo.sesiMasuk > 20) {
		const nextClass = await tx.kelas.findFirst({
			where: {
				cohortId: kelas.cohortId,
				level: kelas.level + 1,
			},
			orderBy: { createdAt: "desc" },
		});

		if (nextClass) {
			const nextStartDate = dayjs(input.tanggalMulai)
				.add(1, "month")
				.format("YYYY-MM-DD");

			const nextReg = await tx.pendaftaranKelas.create({
				data: {
					muridId: input.muridId,
					kelasId: nextClass.id,
					tanggalMulai: nextStartDate,
					isAktif: true,
				},
			});
			nextLevelRegistrationId = nextReg.id;

			// Tagihan Pending Level Berikutnya
			const tagihanNext = nextClass.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;

			await tx.pembayaran.create({
				data: {
					pendaftaranKelasId: nextReg.id,
					pembayaranKe: 1,
					jumlahBayar: tagihanNext,
					tanggalJatuhTempo: dayjs(nextStartDate).toDate(),
					statusBayar: StatusPembayaran.PENDING,
					note: "Auto-Registration (Very Late Joiner Lvl Sebelumnya)",
				},
			});
		}
	}

	// D. Update Status Murid -> AKTIF
	await tx.murid.update({
		where: { id: input.muridId },
		data: { statusMurid: StatusMurid.AKTIF },
	});

	return { pendaftaran, nextLevelRegistrationId };
};

export const createBulkPendaftaran = async ({
	tx,
	input,
	kelas,
	jumlahSesiBerlalu,
}: CreateBulkPendaftaranParams) => {
	const { muridIds, kelasId, tanggalMulai } = input;

	// B. Hitung Bill Info
	let billInfo: ReturnType<typeof calculateInitialBill>;
	try {
		billInfo = calculateInitialBill(kelas.hargaKelas, jumlahSesiBerlalu);
	} catch (error) {
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message:
				error instanceof Error ? error.message : "Gagal menghitung tagihan",
		});
	}

	let nextClassId: string | null = null;
	let nextClassTagihan = 0;
	let nextStartDateStr = "";
	let nextStartDateDate: Date | undefined;

	if (billInfo.sesiMasuk > 20) {
		const nextClass = await tx.kelas.findFirst({
			where: {
				cohortId: kelas.cohortId,
				level: kelas.level + 1,
			},
			orderBy: { createdAt: "desc" },
		});

		if (nextClass) {
			nextClassId = nextClass.id;
			nextClassTagihan = nextClass.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;
			const nextDateDayjs = dayjs(tanggalMulai).add(1, "month");
			nextStartDateStr = nextDateDayjs.format("YYYY-MM-DD");
			nextStartDateDate = nextDateDayjs.toDate();
		}
	}

	const tglMulaiDate = dayjs(tanggalMulai).toDate();

	for (const muridId of muridIds) {
		const pendaftaran = await tx.pendaftaranKelas.create({
			data: {
				muridId,
				kelasId,
				tanggalMulai,
				isAktif: true,
			},
		});

		await tx.pembayaran.create({
			data: {
				pendaftaranKelasId: pendaftaran.id,
				pembayaranKe: billInfo.pembayaranKe,
				jumlahBayar: billInfo.totalTagihan,
				tanggalJatuhTempo: tglMulaiDate,
				statusBayar: StatusPembayaran.BELUM_LUNAS,
				note: `${billInfo.note} (Bulk Reg)`,
			},
		});

		// C. Handle "Very Late Joiner" (Auto-Register Next Level)
		if (nextClassId && nextStartDateDate) {
			const nextReg = await tx.pendaftaranKelas.create({
				data: {
					muridId,
					kelasId: nextClassId,
					tanggalMulai: nextStartDateStr,
					isAktif: true,
				},
			});

			await tx.pembayaran.create({
				data: {
					pendaftaranKelasId: nextReg.id,
					pembayaranKe: 1,
					jumlahBayar: nextClassTagihan,
					tanggalJatuhTempo: nextStartDateDate,
					statusBayar: StatusPembayaran.PENDING,
					note: "Auto-Registration (Very Late Joiner Bulk)",
				},
			});
		}
	}

	// D. Update Status Murid -> AKTIF (Bulk)
	await tx.murid.updateMany({
		where: { id: { in: muridIds } },
		data: { statusMurid: StatusMurid.AKTIF },
	});

	return { success: true, count: muridIds.length };
};
