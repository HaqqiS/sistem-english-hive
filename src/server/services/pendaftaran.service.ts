import {
	type PrismaClient,
	StatusMurid,
	StatusPembayaran,
	StatusPendaftaran,
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
		tanggalMulai?: string | null;
		status?: StatusPendaftaran;
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
		tanggalMulai?: string | null;
		status?: StatusPendaftaran;
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
	const isWaitingList = input.status === StatusPendaftaran.WAITING_LIST;

	// 1. Kalkulasi Tagihan (SKIP if WAITING_LIST)
	let billInfo: ReturnType<typeof calculateInitialBill> | null = null;

	if (!isWaitingList) {
		try {
			billInfo = calculateInitialBill(kelas.hargaKelas, jumlahSesiBerlalu);
		} catch (error) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message:
					error instanceof Error ? error.message : "Gagal menghitung tagihan",
			});
		}
	}

	// A. Create Pendaftaran Utama
	const pendaftaran = await tx.pendaftaranKelas.create({
		data: {
			...input,
			status: input.status ?? StatusPendaftaran.AKTIF,
		},
	});

	// B. Create Tagihan Utama (HANYA JIKA BUKAN TRIAL DAN BUKAN WAITING_LIST)
	if (input.status !== StatusPendaftaran.TRIAL && !isWaitingList && billInfo) {
		if (!input.tanggalMulai) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Tanggal mulai wajib diisi untuk status AKTIF",
			});
		}
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
	}

	// C. CEK "VERY LATE JOINER" (Sesi 21-24) - SKIP if WAITING_LIST
	let nextLevelRegistrationId: string | null = null;

	if (billInfo && billInfo.sesiMasuk > 20 && !isWaitingList) {
		const nextClass = await tx.kelas.findFirst({
			where: {
				cohortId: kelas.cohortId,
				level: kelas.level + 1,
			},
			orderBy: { createdAt: "desc" },
		});

		if (nextClass && input.tanggalMulai) {
			const nextStartDate = dayjs(input.tanggalMulai)
				.add(1, "month")
				.format("YYYY-MM-DD");

			const nextReg = await tx.pendaftaranKelas.create({
				data: {
					muridId: input.muridId,
					kelasId: nextClass.id,
					tanggalMulai: nextStartDate,
					status: StatusPendaftaran.AKTIF,
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

	// D. Update Status Murid
	// Jika WAITING_LIST -> Update status murid jadi WAITING_LIST
	// Jika AKTIF -> Update status murid jadi AKTIF
	const targetStatusMurid = isWaitingList
		? StatusMurid.WAITING_LIST
		: StatusMurid.AKTIF;

	await tx.murid.update({
		where: { id: input.muridId },
		data: { statusMurid: targetStatusMurid },
	});

	return { pendaftaran, nextLevelRegistrationId };
};

export const createBulkPendaftaran = async ({
	tx,
	input,
	kelas,
	jumlahSesiBerlalu,
}: CreateBulkPendaftaranParams) => {
	const { muridIds, kelasId, tanggalMulai, status } = input;
	const isWaitingList = status === StatusPendaftaran.WAITING_LIST;

	// B. Hitung Bill Info (SKIP if WAITING_LIST)
	let billInfo: ReturnType<typeof calculateInitialBill> | null = null;
	if (!isWaitingList) {
		try {
			billInfo = calculateInitialBill(kelas.hargaKelas, jumlahSesiBerlalu);
		} catch (error) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message:
					error instanceof Error ? error.message : "Gagal menghitung tagihan",
			});
		}
	}

	let nextClassId: string | null = null;
	let nextClassTagihan = 0;
	let nextStartDateStr = "";
	let nextStartDateDate: Date | undefined;

	if (billInfo && billInfo.sesiMasuk > 20 && !isWaitingList) {
		const nextClass = await tx.kelas.findFirst({
			where: {
				cohortId: kelas.cohortId,
				level: kelas.level + 1,
			},
			orderBy: { createdAt: "desc" },
		});

		if (nextClass && tanggalMulai) {
			nextClassId = nextClass.id;
			nextClassTagihan = nextClass.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;
			const nextDateDayjs = dayjs(tanggalMulai).add(1, "month");
			nextStartDateStr = nextDateDayjs.format("YYYY-MM-DD");
			nextStartDateDate = nextDateDayjs.toDate();
		}
	}

	const tglMulaiDate = tanggalMulai ? dayjs(tanggalMulai).toDate() : undefined;

	for (const muridId of muridIds) {
		const pendaftaran = await tx.pendaftaranKelas.create({
			data: {
				muridId,
				kelasId,
				tanggalMulai,
				status: status ?? StatusPendaftaran.AKTIF,
			},
		});

		if (!isWaitingList && billInfo && tglMulaiDate) {
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
		}

		// C. Handle "Very Late Joiner" (Auto-Register Next Level)
		if (
			!isWaitingList &&
			nextClassId &&
			nextStartDateDate &&
			nextStartDateStr
		) {
			const nextReg = await tx.pendaftaranKelas.create({
				data: {
					muridId,
					kelasId: nextClassId,
					tanggalMulai: nextStartDateStr,
					status: StatusPendaftaran.AKTIF,
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
	const targetStatusMurid = isWaitingList
		? StatusMurid.WAITING_LIST
		: StatusMurid.AKTIF;

	await tx.murid.updateMany({
		where: { id: { in: muridIds } },
		data: { statusMurid: targetStatusMurid },
	});

	return { success: true, count: muridIds.length };
};
