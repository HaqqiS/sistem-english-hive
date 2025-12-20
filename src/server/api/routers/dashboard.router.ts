import { type Prisma, StatusMurid, StatusPembayaran } from "@prisma/client";
import { cabangProtectedProcedure, createTRPCRouter } from "@/server/api/trpc";
import dayjs from "@/utils/dateUtils";

export const dashboardRouter = createTRPCRouter({
	// 1. KPI Stats
	getKpiStats: cabangProtectedProcedure.query(async ({ ctx }) => {
		const { db, allowedCabangId } = ctx;

		// Filter dasar untuk cabang
		const muridFilter: Prisma.MuridWhereInput = allowedCabangId
			? { cabangId: allowedCabangId }
			: {};
		const kelasFilter: Prisma.KelasWhereInput = allowedCabangId
			? { cabangId: allowedCabangId }
			: {};
		const pembayaranFilter: Prisma.PembayaranWhereInput = allowedCabangId
			? { pendaftaranKelas: { Kelas: { cabangId: allowedCabangId } } }
			: {};

		// Hitung secara paralel
		const [
			totalMuridAktif,
			totalKelasAktif,
			pendingPaymentRaw,
			attendanceToday,
		] = await Promise.all([
			// A. Total Murid Aktif
			db.murid.count({
				where: {
					...muridFilter,
					statusMurid: StatusMurid.AKTIF,
				},
			}),

			// B. Total Kelas Aktif (Logic: Ada jadwal di masa depan atau statusnya dianggap aktif)
			// Sederhananya kita hitung Kelas yang memiliki PendaftaranAktif > 0 atau sekedar count Kelas
			// Revisi: Kita hitung jumlah UNIQUE kelas yang sedang berjalan periode ini
			db.kelas.count({
				where: {
					...kelasFilter,
					// Bisa tambahkan filter bulanTahunAjar jika perlu, sementara ambil semua master kelas
				},
			}),

			// C. Pending Payment (Nominal)
			db.pembayaran.aggregate({
				where: {
					...pembayaranFilter,
					statusBayar: {
						in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
					},
				},
				_sum: {
					jumlahBayar: true,
				},
			}),

			// D. Attendance Rate Hari Ini
			(async () => {
				const startOfDay = dayjs().startOf("day").toDate();
				const endOfDay = dayjs().endOf("day").toDate();

				// Cari semua sesi hari ini
				const sesiHariIni = await db.sesiPertemuanKelas.findMany({
					where: {
						tanggalWaktu: {
							gte: startOfDay,
							lte: endOfDay,
						},
						kelas: allowedCabangId ? { cabangId: allowedCabangId } : undefined,
					},
					select: {
						id: true,
						absensiMurids: {
							select: {
								status: true,
							},
						},
					},
				});

				if (sesiHariIni.length === 0) return { present: 0, total: 0, rate: 0 };

				let totalRecord = 0;
				let totalHadir = 0;

				for (const sesi of sesiHariIni) {
					for (const absen of sesi.absensiMurids) {
						totalRecord++;
						if (absen.status === "HADIR") {
							totalHadir++;
						}
					}
				}

				const rate = totalRecord > 0 ? (totalHadir / totalRecord) * 100 : 0;
				return { present: totalHadir, total: totalRecord, rate };
			})(),
		]);

		return {
			totalMuridAktif,
			totalKelasAktif,
			pendingPayment: pendingPaymentRaw._sum.jumlahBayar ?? 0,
			attendanceRate: Math.round(attendanceToday.rate),
		};
	}),

	// 2. Trend Pendaftaran (6 Bulan Terakhir)
	getRegistrationTrend: cabangProtectedProcedure.query(async ({ ctx }) => {
		const { db, allowedCabangId } = ctx;
		const sixMonthsAgo = dayjs().subtract(6, "month").startOf("month").toDate();

		// Gunakan groupBy untuk performa (support depends on DB, but findMany + JS reduce is safer for diverse dates)
		const registrations = await db.murid.findMany({
			where: {
				createdAt: { gte: sixMonthsAgo },
				cabangId: allowedCabangId ?? undefined,
			},
			select: { createdAt: true },
			orderBy: { createdAt: "asc" },
		});

		// Grouping per bulan
		const grouped = new Map<string, number>();

		// Init 6 bulan terakhir dengan 0 agar grafik rata
		for (let i = 5; i >= 0; i--) {
			const key = dayjs().subtract(i, "month").format("MMM YYYY");
			grouped.set(key, 0);
		}

		for (const r of registrations) {
			const key = dayjs(r.createdAt).format("MMM YYYY");
			if (grouped.has(key)) {
				grouped.set(key, (grouped.get(key) || 0) + 1);
			}
		}

		return Array.from(grouped.entries()).map(([name, value]) => ({
			name,
			value,
		}));
	}),

	// 3. Trend Pendapatan (6 Bulan Terakhir)
	getRevenueTrend: cabangProtectedProcedure.query(async ({ ctx }) => {
		const { db, allowedCabangId } = ctx;
		const sixMonthsAgo = dayjs().subtract(6, "month").startOf("month").toDate();

		const payments = await db.pembayaran.findMany({
			where: {
				tanggalBayar: { gte: sixMonthsAgo },
				statusBayar: StatusPembayaran.LUNAS,
				pendaftaranKelas: allowedCabangId
					? { Kelas: { cabangId: allowedCabangId } }
					: undefined,
			},
			select: {
				tanggalBayar: true,
				jumlahBayar: true,
			},
			orderBy: { tanggalBayar: "asc" },
		});

		const grouped = new Map<string, number>();

		for (let i = 5; i >= 0; i--) {
			const key = dayjs().subtract(i, "month").format("MMM YYYY");
			grouped.set(key, 0);
		}

		for (const p of payments) {
			if (!p.tanggalBayar) continue;
			const key = dayjs(p.tanggalBayar).format("MMM YYYY");
			if (grouped.has(key)) {
				grouped.set(key, (grouped.get(key) || 0) + p.jumlahBayar);
			}
		}

		return Array.from(grouped.entries()).map(([name, value]) => ({
			name,
			value,
		}));
	}),

	// 4. Jadwal Hari Ini
	getTodaySchedule: cabangProtectedProcedure.query(async ({ ctx }) => {
		const { db, allowedCabangId } = ctx;
		const startOfDay = dayjs().startOf("day").toDate();
		const endOfDay = dayjs().endOf("day").toDate();

		return db.sesiPertemuanKelas.findMany({
			where: {
				tanggalWaktu: {
					gte: startOfDay,
					lte: endOfDay,
				},
				kelas: allowedCabangId ? { cabangId: allowedCabangId } : undefined,
			},
			include: {
				kelas: {
					select: {
						kodeKelas: true,
						jenisKelas: true,
					},
				},
				ruang: {
					select: {
						namaRuang: true,
					},
				},
				absensiGurus: {
					include: {
						guru: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			orderBy: {
				tanggalWaktu: "asc",
			},
		});
	}),
});
