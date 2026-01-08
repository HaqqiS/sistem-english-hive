import {
	KategoriTagihan,
	type Prisma,
	StatusKelas,
	StatusMurid,
	StatusPembayaran,
} from "@prisma/client";
import z from "zod";
import { cabangProtectedProcedure, createTRPCRouter } from "@/server/api/trpc";
import dayjs from "@/utils/dateUtils";

export const dashboardRouter = createTRPCRouter({
	// 1. KPI Stats
	getKpiStats: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional().nullable() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			// Filter dasar untuk cabang
			const muridFilter: Prisma.MuridWhereInput = filterCabangId
				? { cabangId: filterCabangId }
				: {};
			const kelasFilter: Prisma.KelasWhereInput = filterCabangId
				? { cabangId: filterCabangId }
				: {};
			const pembayaranFilter: Prisma.PembayaranWhereInput = filterCabangId
				? { pendaftaranKelas: { Kelas: { cabangId: filterCabangId } } }
				: {};
			const tagihanLainFilter: Prisma.TagihanLainWhereInput = filterCabangId
				? { murid: { cabangId: filterCabangId } }
				: {};

			// Hitung secara paralel
			const [
				totalMuridAktif,
				totalMuridPendaftarBaru,
				totalMuridTrial,
				totalMuridWaiting,
				totalKelasAktif,
				totalKelasWaiting,
				totalKelasTrial,
				pendingPaymentRaw,
				pendingPaymentBukuRaw,
				pendingPaymentRegistrationRaw,
				attendanceToday,
			] = await Promise.all([
				// A. Total Murid Aktif
				db.murid.count({
					where: {
						...muridFilter,
						statusMurid: StatusMurid.AKTIF,
					},
				}),
				db.murid.count({
					where: {
						...muridFilter,
						statusMurid: StatusMurid.PENDAFTAR_BARU,
					},
				}),
				db.murid.count({
					where: {
						...muridFilter,
						statusMurid: StatusMurid.TRIAL,
					},
				}),
				db.murid.count({
					where: {
						...muridFilter,
						statusMurid: StatusMurid.WAITING_LIST,
					},
				}),

				// B. Total Kelas running, waiting, trial (Logic: Ada jadwal di masa depan atau statusnya dianggap aktif)
				db.kelas.count({
					where: {
						...kelasFilter,
						statusKelas: StatusKelas.RUNNING,
					},
				}),
				db.kelas.count({
					where: {
						...kelasFilter,
						statusKelas: StatusKelas.WAITING,
					},
				}),
				db.kelas.count({
					where: {
						...kelasFilter,
						statusKelas: StatusKelas.TRIAL,
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

				db.tagihanLain.aggregate({
					where: {
						...tagihanLainFilter,
						kategori: KategoriTagihan.BUKU,
						status: {
							in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
						},
					},
					_sum: {
						jumlah: true,
					},
				}),

				db.tagihanLain.aggregate({
					where: {
						...tagihanLainFilter,
						kategori: KategoriTagihan.REGISTRASI,
						status: {
							in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
						},
					},
					_sum: {
						jumlah: true,
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
							kelas: filterCabangId ? { cabangId: filterCabangId } : undefined,
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

					if (sesiHariIni.length === 0)
						return { present: 0, total: 0, rate: 0 };

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
				totalMuridPendaftarBaru,
				totalMuridTrial,
				totalMuridWaiting,
				totalKelasAktif,
				totalKelasWaiting,
				totalKelasTrial,
				pendingPayment: pendingPaymentRaw._sum.jumlahBayar ?? 0,
				pendingPaymentBuku: pendingPaymentBukuRaw._sum.jumlah ?? 0,
				pendingPaymentRegistration:
					pendingPaymentRegistrationRaw._sum.jumlah ?? 0,
				attendanceRate: Math.round(attendanceToday.rate),
			};
		}),

	// 2. Trend Pendaftaran (6 Bulan Terakhir)
	getRegistrationTrend: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional().nullable() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;
			const sixMonthsAgo = dayjs()
				.subtract(6, "month")
				.startOf("month")
				.toDate();

			// Gunakan groupBy untuk performa (support depends on DB, but findMany + JS reduce is safer for diverse dates)
			const registrations = await db.murid.findMany({
				where: {
					createdAt: { gte: sixMonthsAgo },
					cabangId: filterCabangId ?? undefined,
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
	getRevenueTrend: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional().nullable() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;
			const sixMonthsAgo = dayjs()
				.subtract(6, "month")
				.startOf("month")
				.toDate();

			const payments = await db.pembayaran.findMany({
				where: {
					tanggalBayar: { gte: sixMonthsAgo },
					statusBayar: StatusPembayaran.LUNAS,
					pendaftaranKelas: filterCabangId
						? { Kelas: { cabangId: filterCabangId } }
						: undefined,
				},
				select: {
					tanggalBayar: true,
					jumlahBayar: true,
				},
				orderBy: { tanggalBayar: "asc" },
			});

			const otherBills = await db.tagihanLain.findMany({
				where: {
					updatedAt: { gte: sixMonthsAgo },
					status: StatusPembayaran.LUNAS,
					murid: filterCabangId ? { cabangId: filterCabangId } : undefined,
				},
				select: {
					updatedAt: true,
					jumlah: true,
					kategori: true,
				},
				orderBy: { updatedAt: "asc" },
			});

			const grouped = new Map<
				string,
				{ total: number; spp: number; buku: number; registration: number }
			>();

			for (let i = 5; i >= 0; i--) {
				const key = dayjs().subtract(i, "month").format("MMM YYYY");
				grouped.set(key, { total: 0, spp: 0, buku: 0, registration: 0 });
			}

			// Aggregate SPP
			for (const p of payments) {
				if (!p.tanggalBayar) continue;
				const key = dayjs(p.tanggalBayar).format("MMM YYYY");
				if (grouped.has(key)) {
					const curr = grouped.get(key);
					if (!curr) continue;
					curr.total += p.jumlahBayar;
					curr.spp += p.jumlahBayar;
					grouped.set(key, curr);
				}
			}

			// Aggregate Other Bills (Buku & Registrasi)
			for (const bill of otherBills) {
				const key = dayjs(bill.updatedAt).format("MMM YYYY");
				if (grouped.has(key)) {
					const curr = grouped.get(key);
					if (!curr) continue;
					curr.total += bill.jumlah;
					if (bill.kategori === KategoriTagihan.BUKU) {
						curr.buku += bill.jumlah;
					} else if (bill.kategori === KategoriTagihan.REGISTRASI) {
						curr.registration += bill.jumlah;
					}
					// Note: If LAINNYA exists, it usually adds to total but maybe not specific category here unless requested.
					// Current logic: total includes everything, breakdwon specific.
					grouped.set(key, curr);
				}
			}

			return Array.from(grouped.entries()).map(([name, value]) => ({
				name,
				...value,
			}));
		}),

	// 4. Jadwal Hari Ini
	getTodaySchedule: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional().nullable() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			// Mapping hari JS (0=Minggu, 1=Senin, dst) ke Enum Prisma
			const hariIni = dayjs().day();
			const HARI_ENUM = [
				"MINGGU",
				"SENIN",
				"SELASA",
				"RABU",
				"KAMIS",
				"JUMAT",
				"SABTU",
			] as const;
			const hariPrisma = HARI_ENUM[hariIni];

			if (!hariPrisma) return [];

			return db.jadwalKelas.findMany({
				where: {
					hari: hariPrisma,
					// Filter cabang via Kelas karena JadwalKelas tidak punya cabangId langsung (opsional, tapi safer via relation)
					kelas: filterCabangId ? { cabangId: filterCabangId } : undefined,
				},
				include: {
					kelas: {
						select: {
							kodeKelas: true,
							jenisKelasRel: { select: { nama: true } },
							statusKelas: true,
							// Ambil guru yang sedang aktif mengajar kelas ini
							historyGuruKelases: {
								where: {
									statusGuru: "ACTIVE",
								},
								take: 1, // Ambil 1 guru aktif
								include: {
									guru: {
										select: {
											name: true,
										},
									},
								},
							},
						},
					},
					ruang: {
						select: {
							namaRuang: true,
						},
					},
					jamSlotTetap: {
						select: {
							jamMulai: true,
						},
					},
					jamSlotCustom: {
						select: {
							jamMulai: true,
						},
					},
					sesiPertemuanKelases: {
						where: {
							tanggalWaktu: {
								gte: dayjs().startOf("day").toDate(),
								lte: dayjs().endOf("day").toDate(),
							},
						},
						select: {
							id: true,
						},
					},
				},
				// Order by jam mulai (sedikit tricky karena ada 2 source, kita bisa sort di JS atau terima order database apa adanya lalu sort di client/server)
				// Untuk simpelnya kita tidak sorting di level DB dulu karena conditional column sorting
			});
		}),
});
