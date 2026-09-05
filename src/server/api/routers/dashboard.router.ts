import {
	KategoriTagihan,
	type Prisma,
	StatusKelas,
	StatusMurid,
	StatusPembayaran,
	StatusPendaftaran,
} from "@prisma/client";
import z from "zod";
import { JUMLAH_PERTEMUAN_PER_BLOK } from "@/constants/pembayaran";
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
					tanggalBayar: { gte: sixMonthsAgo },
					status: StatusPembayaran.LUNAS,
					murid: filterCabangId ? { cabangId: filterCabangId } : undefined,
				},
				select: {
					tanggalBayar: true,
					jumlah: true,
					kategori: true,
				},
				orderBy: { tanggalBayar: "asc" },
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
				if (!bill.tanggalBayar) continue;
				const key = dayjs(bill.tanggalBayar).format("MMM YYYY");
				if (grouped.has(key)) {
					const curr = grouped.get(key);
					if (!curr) continue;
					curr.total += bill.jumlah;
					if (bill.kategori === KategoriTagihan.BUKU) {
						curr.buku += bill.jumlah;
					} else if (bill.kategori === KategoriTagihan.REGISTRASI) {
						curr.registration += bill.jumlah;
					}
					grouped.set(key, curr);
				}
			}

			return Array.from(grouped.entries()).map(([name, value]) => ({
				name,
				...value,
			}));
		}),

	// 3b. Estimasi Pendapatan Bulan Berjalan, dihitung dari JUMLAH SISWA AKTIF
	// (Reguler & Privat) dikali HARGA KELAS (per pertemuan) dikali JUMLAH
	// PERTEMUAN PER BLOK TAGIHAN (8x pertemuan) — bukan dari cicilan yang
	// sudah diinput admin di tabel Pembayaran.
	//
	// hargaKelas di database itu HARGA PER SESI/PERTEMUAN, sedangkan siswa
	// ditagih per blok 8x pertemuan sekali (lihat JUMLAH_PERTEMUAN_PER_BLOK
	// di constants/pembayaran.ts, dipakai juga di pendaftaran.service.ts &
	// kelas.service.ts saat generate tagihan). Jadi estimasi per siswa =
	// hargaKelas x 8, bukan hargaKelas doang.
	//
	// Kenapa headcount x harga, bukan dari jadwal tagihan riil: karena
	// tagihan yang jatuh tempo akhir bulan sering baru lunas di awal bulan
	// berikutnya (uangnya cuma geser tanggal), jadi kalau dasarnya jadwal
	// tagihan, angkanya bisa naik-turun semu dan juga tidak akan muncul kalau
	// admin belum sempat generate cicilan untuk bulan depan. Dengan basis
	// jumlah siswa aktif x harga per blok, angkanya stabil & tidak bergantung
	// pada apakah cicilan bulan depan sudah diinput atau belum — murni
	// "kalau siswa yang aktif sekarang tetap bayar 1 blok (8x pertemuan),
	// segini estimasinya".
	//
	// Ini BEDA dengan "Pending Payment" di KPI Card (yang menjumlahkan
	// tagihan riil yang TELAT/belum lunas, bukan estimasi kapasitas siswa).
	getPrediksiPendapatanBulanan: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional().nullable() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const bulanTarget = dayjs(); // bulan berjalan

			// Ambil semua kelas yang masih berjalan beserta jumlah siswa yang
			// pendaftarannya masih AKTIF di kelas tsb.
			const kelasAktif = await db.kelas.findMany({
				where: {
					statusKelas: StatusKelas.RUNNING,
					cabangId: filterCabangId ?? undefined,
				},
				select: {
					hargaKelas: true,
					jenisKelasRel: { select: { tipe: true } },
					pendaftaranKelases: {
						where: { status: StatusPendaftaran.AKTIF },
						select: { id: true, muridId: true },
					},
				},
			});

			type Kelompok = { nominal: number; muridIds: Set<string> };
			const buatKelompokKosong = (): Kelompok => ({
				nominal: 0,
				muridIds: new Set(),
			});

			const reguler = buatKelompokKosong();
			const privat = buatKelompokKosong();
			const lainnya = buatKelompokKosong();

			for (const kelas of kelasAktif) {
				const jumlahSiswaAktif = kelas.pendaftaranKelases.length;
				if (jumlahSiswaAktif === 0) continue;

				const hargaPerBlok = kelas.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;
				// Nominal tetap dihitung PER PENDAFTARAN/ENROLLMENT (bukan per murid
				// unik), karena satu murid yang ambil 2 kelas aktif memang ditagih
				// 2x. Jadi nominalnya benar-benar sesuai jumlah tagihan riil.
				const nominal = jumlahSiswaAktif * hargaPerBlok;
				const tipe = kelas.jenisKelasRel?.tipe;
				const kelompok =
					tipe === "REGULAR" ? reguler : tipe === "PRIVATE" ? privat : lainnya;

				kelompok.nominal += nominal;
				// jumlahSiswa dihitung dari MURID UNIK (dedupe pakai Set), supaya
				// murid yang kebetulan aktif di lebih dari 1 kelas RUNNING dengan
				// tipe yang sama tidak dobel dihitung sebagai 2 "siswa".
				for (const p of kelas.pendaftaranKelases) {
					kelompok.muridIds.add(p.muridId);
				}
			}

			const ringkas = (k: Kelompok) => ({
				nominal: k.nominal,
				jumlahSiswa: k.muridIds.size,
			});

			const regulerRingkas = ringkas(reguler);
			const privatRingkas = ringkas(privat);
			const lainnyaRingkas = ringkas(lainnya);

			return {
				bulan: bulanTarget.format("MMMM YYYY"),
				total:
					regulerRingkas.nominal +
					privatRingkas.nominal +
					lainnyaRingkas.nominal,
				reguler: regulerRingkas,
				privat: privatRingkas,
				lainnya: lainnyaRingkas,
			};
		}),

	// 3c. Akurasi Prediksi Bulan-Bulan Lalu: membandingkan total tagihan yang
	// terjadwal jatuh tempo di bulan tsb (basis "prediksi" saat itu) dengan
	// berapa yang benar-benar sudah lunas dari tagihan tsb (realisasi).
	// Hanya untuk bulan yang SUDAH LEWAT (bulan berjalan belum dihitung
	// karena belum selesai periodenya).
	getAkurasiPrediksi: cabangProtectedProcedure
		.input(
			z
				.object({
					cabangId: z.string().optional().nullable(),
					jumlahBulan: z.number().min(1).max(12).default(3),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;
			const jumlahBulan = input?.jumlahBulan ?? 3;

			const rangeStart = dayjs()
				.subtract(jumlahBulan, "month")
				.startOf("month")
				.toDate();
			const rangeEnd = dayjs().startOf("month").toDate(); // eksklusif, sebelum bulan berjalan

			const tagihanLalu = await db.pembayaran.findMany({
				where: {
					tanggalJatuhTempo: { gte: rangeStart, lt: rangeEnd },
					pendaftaranKelas: filterCabangId
						? { Kelas: { cabangId: filterCabangId } }
						: undefined,
				},
				select: {
					jumlahBayar: true,
					tanggalJatuhTempo: true,
					statusBayar: true,
				},
			});

			type BulanAgg = { totalTagihan: number; totalTerbayar: number };
			const grouped = new Map<string, BulanAgg>();
			for (let i = jumlahBulan; i >= 1; i--) {
				const key = dayjs().subtract(i, "month").format("MMM YYYY");
				grouped.set(key, { totalTagihan: 0, totalTerbayar: 0 });
			}

			for (const t of tagihanLalu) {
				const key = dayjs(t.tanggalJatuhTempo).format("MMM YYYY");
				const agg = grouped.get(key);
				if (!agg) continue;

				agg.totalTagihan += t.jumlahBayar;
				if (t.statusBayar === StatusPembayaran.LUNAS) {
					agg.totalTerbayar += t.jumlahBayar;
				}
			}

			return Array.from(grouped.entries()).map(([bulan, agg]) => ({
				bulan,
				totalTagihan: agg.totalTagihan,
				totalTerbayar: agg.totalTerbayar,
				akurasiPersen:
					agg.totalTagihan > 0
						? Math.round((agg.totalTerbayar / agg.totalTagihan) * 1000) / 10
						: null,
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
								// take: 1, // Ambil semua guru aktif
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
							isSelesaiAbsen: true,
						},
					},
				},
				// Order by jam mulai (sedikit tricky karena ada 2 source, kita bisa sort di JS atau terima order database apa adanya lalu sort di client/server)
				// Untuk simpelnya kita tidak sorting di level DB dulu karena conditional column sorting
			});
		}),

	// 5. Distribusi Sumber Info (Pie Chart)
	getSumberInfoDistribution: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional().nullable() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId;

			const result = await db.murid.groupBy({
				by: ["sumberInfo"],
				where: {
					cabangId: filterCabangId ?? undefined,
				},
				_count: {
					sumberInfo: true,
				},
			});

			// Grouping into specific categories
			const categories = {
				Instagram: 0,
				WhatsApp: 0,
				Teman: 0,
				Other: 0,
			};

			for (const item of result) {
				if (item.sumberInfo === "Instagram") {
					categories.Instagram += item._count.sumberInfo;
				} else if (item.sumberInfo === "WhatsApp") {
					categories.WhatsApp += item._count.sumberInfo;
				} else if (item.sumberInfo === "Teman") {
					categories.Teman += item._count.sumberInfo;
				} else {
					categories.Other += item._count.sumberInfo;
				}
			}

			// Transform to array format
			const finalResult = Object.entries(categories)
				.map(([key, value]) => ({
					sumberInfo: key,
					count: value,
				}))
				.filter((item) => item.count > 0); // Only return categories with data

			return finalResult;
		}),

	// KELAS DENGAN TAGIHAN SPP JATUH TEMPO H-14 (dikelompokkan per kelas)
	getKelasJatuhTempoH14: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional().nullable() }).optional())
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;
			const filterCabangId = allowedCabangId ?? input?.cabangId ?? undefined;

			const batasTempo = dayjs().add(14, "day").endOf("day").toDate();

			// 1. Cari trigger: tagihan SPP yang jatuh tempo dalam 14 hari ke depan.
			// Catatan: Buku & Registrasi (TagihanLain) tidak punya kolom tanggal
			// jatuh tempo di database, jadi trigger H-14 berbasis tagihan SPP saja.
			const tagihanSppTrigger = await db.pembayaran.findMany({
				where: {
					statusBayar: {
						in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
					},
					tanggalJatuhTempo: { lte: batasTempo },
					pendaftaranKelas: filterCabangId
						? { Kelas: { cabangId: filterCabangId } }
						: undefined,
				},
				orderBy: { tanggalJatuhTempo: "asc" },
				include: {
					pendaftaranKelas: {
						include: {
							murid: { select: { id: true, namaLengkap: true, noWA: true } },
							Kelas: {
								select: {
									id: true,
									kodeKelas: true,
									cabang: {
										select: {
											noRekening: true,
											bank: true,
											atasNama: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (tagihanSppTrigger.length === 0) return [];

			// Kumpulkan pasangan unik (kelasId, muridId) yang ter-trigger, plus
			// tagihan SPP pemicunya (bisa lebih dari satu per siswa).
			type TriggerItem = {
				label: string;
				jumlah: number;
				tanggalJatuhTempo: Date;
			};
			const triggerMap = new Map<
				string, // `${kelasId}::${muridId}`
				{
					kelasId: string;
					kodeKelas: string;
					cabang: {
						noRekening: string | null;
						bank: string | null;
						atasNama: string | null;
					} | null;
					muridId: string;
					namaLengkap: string;
					noWA: string;
					triggers: TriggerItem[];
				}
			>();

			for (const t of tagihanSppTrigger) {
				const kelas = t.pendaftaranKelas.Kelas;
				const murid = t.pendaftaranKelas.murid;
				const key = `${kelas.id}::${murid.id}`;
				const existing = triggerMap.get(key);
				const triggerItem: TriggerItem = {
					label: `SPP Ke-${t.pembayaranKe}`,
					jumlah: t.jumlahBayar,
					tanggalJatuhTempo: t.tanggalJatuhTempo,
				};
				if (existing) {
					existing.triggers.push(triggerItem);
				} else {
					triggerMap.set(key, {
						kelasId: kelas.id,
						kodeKelas: kelas.kodeKelas,
						cabang: kelas.cabang,
						muridId: murid.id,
						namaLengkap: murid.namaLengkap,
						noWA: murid.noWA,
						triggers: [triggerItem],
					});
				}
			}

			const kelasIds = [
				...new Set([...triggerMap.values()].map((t) => t.kelasId)),
			];
			const muridIds = [
				...new Set([...triggerMap.values()].map((t) => t.muridId)),
			];

			// 2. Ambil SEMUA tagihan belum lunas (SPP + Buku + Registrasi) milik
			// siswa-siswa yang ter-trigger, supaya pesan pengingat mengikuti tenggat
			// SPP tapi tetap merangkum semua tagihan siswa tsb di kelas itu.
			const [semuaSpp, semuaTagihanLain] = await Promise.all([
				db.pembayaran.findMany({
					where: {
						statusBayar: {
							in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
						},
						pendaftaranKelas: {
							kelasId: { in: kelasIds },
							muridId: { in: muridIds },
						},
					},
					select: {
						id: true,
						jumlahBayar: true,
						pembayaranKe: true,
						sudahDiingatkan: true,
						pendaftaranKelas: { select: { kelasId: true, muridId: true } },
					},
				}),
				db.tagihanLain.findMany({
					where: {
						status: {
							in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
						},
						kelasId: { in: kelasIds },
						muridId: { in: muridIds },
					},
					select: {
						id: true,
						judul: true,
						jumlah: true,
						kelasId: true,
						muridId: true,
						kategori: true,
						sudahDiingatkan: true,
					},
				}),
			]);

			type SemuaTagihanItem = {
				id: string;
				jenis: "SPP" | "BUKU" | "REGISTRASI";
				label: string;
				jumlah: number;
				sudahDiingatkan: boolean;
			};
			const semuaTagihanMap = new Map<string, SemuaTagihanItem[]>(); // key: kelasId::muridId

			for (const p of semuaSpp) {
				const key = `${p.pendaftaranKelas.kelasId}::${p.pendaftaranKelas.muridId}`;
				const list = semuaTagihanMap.get(key) ?? [];
				list.push({
					id: p.id,
					jenis: "SPP",
					label: `SPP Ke-${p.pembayaranKe}`,
					jumlah: p.jumlahBayar,
					sudahDiingatkan: p.sudahDiingatkan,
				});
				semuaTagihanMap.set(key, list);
			}
			for (const t of semuaTagihanLain) {
				if (!t.kelasId) continue;
				const key = `${t.kelasId}::${t.muridId}`;
				const list = semuaTagihanMap.get(key) ?? [];
				list.push({
					id: t.id,
					jenis: t.kategori === "BUKU" ? "BUKU" : "REGISTRASI",
					label: t.judul,
					jumlah: t.jumlah,
					sudahDiingatkan: t.sudahDiingatkan,
				});
				semuaTagihanMap.set(key, list);
			}

			// 3. Susun hasil: per kelas -> per siswa (satu baris per siswa, dengan
			// rincian tagihan pemicu + total semua tagihan belum lunas).
			const kelasMap = new Map<
				string,
				{
					kelasId: string;
					kodeKelas: string;
					cabang: {
						noRekening: string | null;
						bank: string | null;
						atasNama: string | null;
					} | null;
					siswa: {
						muridId: string;
						namaLengkap: string;
						noWA: string;
						triggers: TriggerItem[];
						tenggatTerdekat: Date;
						semuaTagihan: SemuaTagihanItem[];
						totalBelumLunas: number;
					}[];
				}
			>();

			for (const [key, trig] of triggerMap.entries()) {
				const semuaTagihan = semuaTagihanMap.get(key) ?? [];
				const totalBelumLunas = semuaTagihan.reduce(
					(sum, item) => sum + item.jumlah,
					0,
				);
				const tenggatTerdekat = trig.triggers
					.map((t) => t.tanggalJatuhTempo)
					.sort((a, b) => a.getTime() - b.getTime())[0] as Date;

				const existing = kelasMap.get(trig.kelasId);
				const siswaItem = {
					muridId: trig.muridId,
					namaLengkap: trig.namaLengkap,
					noWA: trig.noWA,
					triggers: trig.triggers,
					tenggatTerdekat,
					semuaTagihan,
					totalBelumLunas,
				};
				if (existing) {
					existing.siswa.push(siswaItem);
				} else {
					kelasMap.set(trig.kelasId, {
						kelasId: trig.kelasId,
						kodeKelas: trig.kodeKelas,
						cabang: trig.cabang,
						siswa: [siswaItem],
					});
				}
			}

			for (const kelas of kelasMap.values()) {
				kelas.siswa.sort(
					(a, b) => a.tenggatTerdekat.getTime() - b.tenggatTerdekat.getTime(),
				);
			}

			// Urutkan kelas berdasarkan tenggat TERDEKAT (paling mendesak di atas,
			// paling lama/jauh di bawah) — bukan abjad kode kelas.
			return Array.from(kelasMap.values()).sort((a, b) => {
				const tenggatA = a.siswa[0]?.tenggatTerdekat.getTime() ?? Infinity;
				const tenggatB = b.siswa[0]?.tenggatTerdekat.getTime() ?? Infinity;
				return tenggatA - tenggatB;
			});
		}),
});
