import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	cabangProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";

// Local enums (workaround sampai prisma generate dijalankan)
const StatusOrderBuku2 = { DIORDER: "DIORDER", READY: "READY" } as const;
const StatusPenerimaanBuku = {
	BELUM_DIAMBIL: "BELUM_DIAMBIL",
	SUDAH_DIAMBIL: "SUDAH_DIAMBIL",
} as const;

export const stokBukuRouter = createTRPCRouter({
	// ── GET ALL STOK BUKU ─────────────────────────────────────────────────────
	getAllStokBuku: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }))
		.query(async ({ ctx }) => {
			return ctx.db.stokBuku.findMany({
				where: ctx.allowedCabangId
					? { cabangId: ctx.allowedCabangId }
					: undefined,
				include: {
					jenisKelas: { select: { id: true, nama: true, tipe: true } },
					cabang: { select: { id: true, namaCabang: true } },
					penerimaBukus: {
						select: { id: true, status: true, statusOrder: true },
					},
				},
				orderBy: [{ jenisKelas: { nama: "asc" } }, { level: "asc" }],
			});
		}),

	// ── GET JENIS KELAS TERSEDIA ───────────────────────────────────────────────
	getJenisKelasUntukStok: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }))
		.query(async ({ ctx }) => {
			if (!ctx.allowedCabangId) return [];
			const allJenisKelas = await ctx.db.jenisKelasModel.findMany({
				where: { cabangId: ctx.allowedCabangId },
				select: { id: true, nama: true, tipe: true },
				orderBy: { nama: "asc" },
			});

			// Kalau ada jenis kelas REGULAR dan PRIVATE dengan nama yang sama,
			// tampilkan yang REGULAR saja. Jenis kelas PRIVATE hanya ditampilkan
			// kalau tidak ada versi REGULAR dengan nama yang sama.
			const byNama = new Map<string, (typeof allJenisKelas)[number]>();
			for (const jk of allJenisKelas) {
				const existing = byNama.get(jk.nama);
				if (!existing) {
					byNama.set(jk.nama, jk);
				} else if (existing.tipe !== "REGULAR" && jk.tipe === "REGULAR") {
					// Upgrade ke versi REGULAR kalau sebelumnya cuma PRIVATE
					byNama.set(jk.nama, jk);
				}
			}

			return Array.from(byNama.values()).sort((a, b) =>
				a.nama.localeCompare(b.nama),
			);
		}),

	// ── CREATE STOK BUKU ──────────────────────────────────────────────────────
	createStokBuku: cabangProtectedProcedure
		.input(
			z.object({
				jenisKelasId: z.string(),
				level: z.number().int().min(1).max(4),
				jumlahStok: z.number().int().min(0),
				cabangId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.allowedCabangId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Pilih cabang dulu.",
				});
			return ctx.db.stokBuku.create({
				data: {
					jenisKelasId: input.jenisKelasId,
					level: input.level,
					jumlahStok: input.jumlahStok,
					cabangId: ctx.allowedCabangId,
				},
			});
		}),

	// ── UPDATE STOK BUKU (jumlah) ─────────────────────────────────────────────
	updateJumlahStok: protectedProcedure
		.input(
			z.object({ stokBukuId: z.string(), jumlahStok: z.number().int().min(0) }),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.stokBuku.update({
				where: { id: input.stokBukuId },
				data: { jumlahStok: input.jumlahStok },
			});
		}),

	// ── DELETE STOK BUKU ──────────────────────────────────────────────────────
	deleteStokBuku: protectedProcedure
		.input(z.object({ stokBukuId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.stokBuku.delete({ where: { id: input.stokBukuId } });
		}),

	// ── GET GURU BY KELAS (untuk dropdown Nama Guru) ──────────────────────────
	getGuruByKelas: protectedProcedure
		.input(z.object({ kelasId: z.string() }))
		.query(async ({ ctx, input }) => {
			const histori = await ctx.db.historyGuruKelas.findMany({
				where: { kelasId: input.kelasId, selesaiPada: null },
				select: { guru: { select: { id: true, name: true } } },
			});
			return histori.map((h) => h.guru);
		}),

	// ── GET KELAS BY JENIS KELAS (dropdown bertingkat) ────────────────────────
	getKelasByJenisKelas: cabangProtectedProcedure
		.input(
			z.object({ jenisKelasId: z.string(), cabangId: z.string().optional() }),
		)
		.query(async ({ ctx, input }) => {
			return ctx.db.kelas.findMany({
				where: {
					jenisKelasId: input.jenisKelasId,
					...(ctx.allowedCabangId ? { cabangId: ctx.allowedCabangId } : {}),
					statusKelas: { not: "COMPLETED" },
				},
				select: {
					id: true,
					kodeKelas: true,
					level: true,
					historyGuruKelases: {
						where: { selesaiPada: null },
						select: { guru: { select: { id: true, name: true } } },
					},
					pendaftaranKelases: {
						where: { status: "AKTIF" },
						select: {
							murid: {
								select: { id: true, namaLengkap: true, kelasSekolah: true },
							},
						},
					},
				},
				orderBy: [{ level: "asc" }, { kodeKelas: "asc" }],
			});
		}),

	// ── GET MURID BELUM TERDAFTAR (dari kelas tertentu) ───────────────────────
	getMuridBelumTerdaftar: protectedProcedure
		.input(
			z.object({
				stokBukuId: z.string(),
				kelasId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const stok = await ctx.db.stokBuku.findUnique({
				where: { id: input.stokBukuId },
				select: { cabangId: true },
			});
			if (!stok) return [];

			const existing = await ctx.db.penerimaBuku.findMany({
				where: { stokBukuId: input.stokBukuId },
				select: { muridId: true },
			});
			const existingIds = existing.map((e) => e.muridId);

			if (input.kelasId) {
				const pendaftaran = await ctx.db.pendaftaranKelas.findMany({
					where: {
						kelasId: input.kelasId,
						muridId: { notIn: existingIds },
					},
					include: {
						murid: {
							select: { id: true, namaLengkap: true, kelasSekolah: true },
						},
						Kelas: { select: { level: true } },
					},
					orderBy: { murid: { namaLengkap: "asc" } },
				});
				return pendaftaran.map((p) => ({
					...p.murid,
					levelKelas: (p.Kelas as { level: number } | null)?.level ?? null,
				}));
			}

			const murid = await ctx.db.murid.findMany({
				where: { cabangId: stok.cabangId, id: { notIn: existingIds } },
				select: { id: true, namaLengkap: true, kelasSekolah: true },
				orderBy: { namaLengkap: "asc" },
			});
			return murid.map((m) => ({ ...m, levelKelas: null }));
		}),

	// ── GET PENERIMA BY STOK BUKU ─────────────────────────────────────────────
	getPenerimaByStokBuku: protectedProcedure
		.input(z.object({ stokBukuId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.penerimaBuku.findMany({
				where: { stokBukuId: input.stokBukuId },
				include: {
					murid: {
						select: { id: true, namaLengkap: true, kelasSekolah: true },
					},
					kelas: { select: { id: true, kodeKelas: true, level: true } },
					guruPenerima: {
						include: { guru: { select: { id: true, name: true } } },
					},
				},
				orderBy: { createdAt: "desc" },
			});
		}),

	// ── ADD PENERIMA BUKU ─────────────────────────────────────────────────────
	addPenerimaBuku: protectedProcedure
		.input(
			z.object({
				stokBukuId: z.string(),
				muridIds: z.array(z.string()).min(1),
				kelasId: z.string().optional(),
				guruIds: z.array(z.string()).optional(), // bisa 1 atau lebih guru
				statusOrder: z.enum(["DIORDER", "READY"]).default("DIORDER"),
				tanggalReady: z.date().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Buat penerima buku
			await ctx.db.penerimaBuku.createMany({
				data: input.muridIds.map((muridId) => ({
					stokBukuId: input.stokBukuId,
					muridId,
					kelasId: input.kelasId ?? null,
					statusOrder: input.statusOrder,
					tanggalReady:
						input.statusOrder === "READY" ? (input.tanggalReady ?? null) : null,
				})),
				skipDuplicates: true,
			});

			const newPenerima = await ctx.db.penerimaBuku.findMany({
				where: {
					stokBukuId: input.stokBukuId,
					muridId: { in: input.muridIds },
				},
				select: { id: true, muridId: true },
			});

			if (input.guruIds && input.guruIds.length > 0) {
				// Guru dipilih manual — pakai untuk semua siswa yang baru ditambahkan
				await ctx.db.penerimaBukuGuru.createMany({
					data: newPenerima.flatMap((p) =>
						(input.guruIds ?? []).map((guruId) => ({
							penerimaBukuId: p.id,
							guruId,
						})),
					),
					skipDuplicates: true,
				});
			} else {
				// Tidak ada guru dipilih manual — deteksi otomatis dari kelas aktif
				// masing-masing siswa, supaya buku tetap muncul di dashboard guru
				// yang benar meski admin tidak memilih kelas/guru secara manual.
				const guruAssignments: { penerimaBukuId: string; guruId: string }[] =
					[];

				for (const p of newPenerima) {
					const pendaftaranAktif = await ctx.db.pendaftaranKelas.findMany({
						where: {
							muridId: p.muridId,
							status: { not: "NON_AKTIF" },
						},
						select: {
							Kelas: {
								select: {
									historyGuruKelases: {
										where: { selesaiPada: null },
										select: { guruId: true },
									},
								},
							},
						},
					});

					const guruIdsForMurid = new Set<string>();
					for (const pk of pendaftaranAktif) {
						for (const hg of pk.Kelas.historyGuruKelases) {
							guruIdsForMurid.add(hg.guruId);
						}
					}

					for (const guruId of guruIdsForMurid) {
						guruAssignments.push({ penerimaBukuId: p.id, guruId });
					}
				}

				if (guruAssignments.length > 0) {
					await ctx.db.penerimaBukuGuru.createMany({
						data: guruAssignments,
						skipDuplicates: true,
					});
				}
			}

			return { success: true };
		}),

	// ── ADD GURU KE PENERIMA BUKU ─────────────────────────────────────────────
	addGuruPenerima: protectedProcedure
		.input(
			z.object({
				penerimaBukuId: z.string(),
				guruIds: z.array(z.string()).min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.penerimaBukuGuru.createMany({
				data: input.guruIds.map((guruId) => ({
					penerimaBukuId: input.penerimaBukuId,
					guruId,
				})),
				skipDuplicates: true,
			});
		}),

	// ── REMOVE GURU DARI PENERIMA BUKU ───────────────────────────────────────
	removeGuruPenerima: protectedProcedure
		.input(z.object({ penerimaBukuId: z.string(), guruId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.penerimaBukuGuru.delete({
				where: {
					penerimaBukuId_guruId: {
						penerimaBukuId: input.penerimaBukuId,
						guruId: input.guruId,
					},
				},
			});
		}),

	// ── UPDATE STATUS ORDER PER MURID (admin/manager only) ────────────────────
	updateStatusOrder: protectedProcedure
		.input(
			z.object({
				penerimaBukuId: z.string(),
				statusOrder: z.enum(["DIORDER", "READY"]),
				tanggalReady: z.date().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { role } = ctx.session.user;
			if (role === UserRole.GURU)
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Guru tidak dapat mengubah status order.",
				});
			return ctx.db.penerimaBuku.update({
				where: { id: input.penerimaBukuId },
				data: {
					statusOrder: input.statusOrder,
					tanggalReady: input.tanggalReady ?? null,
				},
			});
		}),

	// ── UPDATE STATUS PENGAMBILAN (guru & admin) ──────────────────────────────
	// Stok berkurang otomatis saat SUDAH_DIAMBIL.
	// Jika dihapus setelah SUDAH_DIAMBIL, stok tidak kembali.
	updateStatusPenerima: protectedProcedure
		.input(
			z.object({
				penerimaBukuId: z.string(),
				status: z.enum(["BELUM_DIAMBIL", "SUDAH_DIAMBIL"]),
				// Kalau diisi, berarti sedang dalam Mode Guru Pengganti —
				// ambilkan buku atas nama guru yang digantikan ini.
				onBehalfOfGuruId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { role, id: userId } = ctx.session.user;
			const isGuru = role === UserRole.GURU;
			const effectiveGuruId = input.onBehalfOfGuruId ?? userId;

			const penerima = await ctx.db.penerimaBuku.findUnique({
				where: { id: input.penerimaBukuId },
				select: {
					kelasId: true,
					status: true,
					stokBukuId: true,
					statusOrder: true,
				},
			});

			if (!penerima)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data tidak ditemukan.",
				});

			// Guru hanya bisa update kalau statusOrder = READY
			if (isGuru && penerima.statusOrder !== StatusOrderBuku2.READY)
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Buku belum berstatus READY.",
				});

			// Guru tidak bisa mengubah status lagi kalau sudah "Diambil" —
			// harus hubungi admin untuk perubahan lebih lanjut
			if (isGuru && penerima.status === StatusPenerimaanBuku.SUDAH_DIAMBIL)
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"Status sudah 'Diambil' dan tidak bisa diubah sendiri. Hubungi admin jika ingin merubah status.",
				});

			// Guru (atau guru pengganti atas nama guru yang digantikan) hanya
			// bisa update kalau guru tersebut terdaftar sebagai guru penerima
			if (isGuru) {
				const isHandle = await ctx.db.penerimaBukuGuru.findFirst({
					where: {
						penerimaBukuId: input.penerimaBukuId,
						guruId: effectiveGuruId,
					},
				});
				if (!isHandle)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: input.onBehalfOfGuruId
							? "Guru yang digantikan tidak terdaftar sebagai penanggung jawab buku ini."
							: "Kamu tidak terdaftar sebagai guru untuk buku ini.",
					});
			}

			// Kurangi stok saat pertama kali jadi SUDAH_DIAMBIL
			const wasNotTaken =
				penerima.status === StatusPenerimaanBuku.BELUM_DIAMBIL;
			const willBeTaken = input.status === StatusPenerimaanBuku.SUDAH_DIAMBIL;
			if (wasNotTaken && willBeTaken) {
				await ctx.db.stokBuku.update({
					where: { id: penerima.stokBukuId },
					data: { jumlahStok: { decrement: 1 } },
				});
			}

			return ctx.db.penerimaBuku.update({
				where: { id: input.penerimaBukuId },
				data: {
					status: input.status,
					tanggalAmbil: willBeTaken ? new Date() : null,
				},
			});
		}),

	// ── DELETE PENERIMA BUKU ──────────────────────────────────────────────────
	// Stok tidak dikembalikan meski statusnya sudah SUDAH_DIAMBIL.
	deletePenerimaBuku: protectedProcedure
		.input(z.object({ penerimaBukuId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.penerimaBuku.delete({
				where: { id: input.penerimaBukuId },
			});
		}),

	// ── GET PENERIMA UNTUK GURU ───────────────────────────────────────────────
	getPenerimaForGuru: protectedProcedure
		.input(z.object({ guruId: z.string().optional() }).optional())
		.query(async ({ ctx, input }) => {
			// Mode Guru Pengganti: kalau guruId dikirim (guru lain dipilih di
			// dashboard), tampilkan buku milik guru tersebut alih-alih guru yang
			// sedang login — sama seperti pola "lihat jadwal guru lain" yang
			// sudah ada di jadwalKelas.router.ts.
			const targetGuruId = input?.guruId ?? ctx.session.user.id;

			// Ambil penerima yang guru ini terdaftar sebagai penanggung jawab
			return ctx.db.penerimaBuku.findMany({
				where: {
					guruPenerima: { some: { guruId: targetGuruId } },
				},
				include: {
					murid: {
						select: { id: true, namaLengkap: true, kelasSekolah: true },
					},
					kelas: { select: { id: true, kodeKelas: true, level: true } },
					guruPenerima: {
						include: { guru: { select: { id: true, name: true } } },
					},
					stokBuku: {
						select: {
							jenisKelas: { select: { nama: true } },
							level: true,
						},
					},
				},
				orderBy: [{ statusOrder: "asc" }, { createdAt: "desc" }],
			});
		}),

	// ── LOG PENGAMBILAN BUKU ──────────────────────────────────────────────────
	getLogPengambilanBuku: cabangProtectedProcedure
		.input(
			z
				.object({
					cabangId: z.string().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const filterCabangId = ctx.allowedCabangId ?? input?.cabangId;

			return ctx.db.penerimaBuku.findMany({
				where: {
					status: "SUDAH_DIAMBIL",
					stokBuku: filterCabangId ? { cabangId: filterCabangId } : undefined,
					murid: input?.search
						? {
								namaLengkap: {
									contains: input.search,
									mode: "insensitive",
								},
							}
						: undefined,
				},
				include: {
					murid: {
						select: { id: true, namaLengkap: true, kelasSekolah: true },
					},
					kelas: { select: { id: true, kodeKelas: true, level: true } },
					guruPenerima: {
						include: { guru: { select: { id: true, name: true } } },
					},
					stokBuku: {
						select: {
							jenisKelas: { select: { nama: true } },
							level: true,
							cabang: { select: { namaCabang: true } },
						},
					},
				},
				orderBy: { tanggalAmbil: "desc" },
			});
		}),
});
