import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	cabangProtectedProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";

// Workaround sampai prisma generate dijalankan ulang
const StatusPenerimaanBuku = {
	BELUM_DIAMBIL: "BELUM_DIAMBIL",
	SUDAH_DIAMBIL: "SUDAH_DIAMBIL",
} as const;

const StatusStokBuku = {
	ORDER: "ORDER",
	READY: "READY",
} as const;

export const stokBukuRouter = createTRPCRouter({
	// =========================
	// GET ALL STOK BUKU
	// =========================
	getAllStokBuku: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }))
		.query(async ({ ctx }) => {
			return ctx.db.stokBuku.findMany({
				where: ctx.allowedCabangId
					? { cabangId: ctx.allowedCabangId }
					: undefined,
				include: {
					jenisKelas: {
						select: { id: true, nama: true, tipe: true, hargaBuku: true },
					},
					cabang: { select: { id: true, namaCabang: true } },
					penerimaBukus: {
						select: { id: true, status: true },
					},
				},
				orderBy: { jenisKelas: { nama: "asc" } },
			});
		}),

	// =========================
	// GET JENIS KELAS YANG BELUM PUNYA STOK
	// =========================
	getJenisKelasTanpaStok: cabangProtectedProcedure
		.input(z.object({ cabangId: z.string().optional() }))
		.query(async ({ ctx }) => {
			if (!ctx.allowedCabangId) return [];

			const existing = await ctx.db.stokBuku.findMany({
				where: { cabangId: ctx.allowedCabangId },
				select: { jenisKelasId: true },
			});
			const existingIds = existing.map((e) => e.jenisKelasId);

			return ctx.db.jenisKelasModel.findMany({
				where: {
					cabangId: ctx.allowedCabangId,
					id: { notIn: existingIds },
				},
				select: { id: true, nama: true, tipe: true, hargaBuku: true },
				orderBy: { nama: "asc" },
			});
		}),

	// =========================
	// CREATE STOK BUKU
	// =========================
	createStokBuku: cabangProtectedProcedure
		.input(
			z.object({
				jenisKelasId: z.string(),
				jumlahStok: z.number().int().min(0),
				cabangId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const targetCabangId = ctx.allowedCabangId;
			if (!targetCabangId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cabang wajib dipilih.",
				});
			}
			return ctx.db.stokBuku.create({
				data: {
					jenisKelasId: input.jenisKelasId,
					jumlahStok: input.jumlahStok,
					cabangId: targetCabangId,
				},
			});
		}),

	// =========================
	// UPDATE JUMLAH STOK + STATUS + TANGGAL READY
	// =========================
	updateStokBuku: protectedProcedure
		.input(
			z.object({
				stokBukuId: z.string(),
				jumlahStok: z.number().int().min(0).optional(),
				statusStok: z.enum(["ORDER", "READY"]).optional(),
				tanggalReady: z.date().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { stokBukuId, ...data } = input;
			return ctx.db.stokBuku.update({
				where: { id: stokBukuId },
				data,
			});
		}),

	// =========================
	// DELETE STOK BUKU
	// =========================
	deleteStokBuku: protectedProcedure
		.input(z.object({ stokBukuId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.stokBuku.delete({ where: { id: input.stokBukuId } });
		}),

	// =========================
	// GET KELAS BY JENIS KELAS (untuk dropdown bertingkat)
	// =========================
	getKelasByJenisKelas: cabangProtectedProcedure
		.input(
			z.object({
				jenisKelasId: z.string(),
				cabangId: z.string().optional(),
			}),
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
					pendaftaranKelases: {
						where: { status: "AKTIF" },
						select: {
							murid: { select: { id: true, namaLengkap: true } },
						},
					},
				},
				orderBy: { kodeKelas: "asc" },
			});
		}),

	// =========================
	// GET MURID BELUM TERDAFTAR (dari kelas tertentu)
	// =========================
	getMuridBelumTerdaftar: cabangProtectedProcedure
		.input(
			z.object({
				stokBukuId: z.string(),
				kelasId: z.string().optional(),
				cabangId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const stokBuku = await ctx.db.stokBuku.findUnique({
				where: { id: input.stokBukuId },
				select: { cabangId: true, jenisKelasId: true },
			});
			if (!stokBuku) return [];

			const existing = await ctx.db.penerimaBuku.findMany({
				where: { stokBukuId: input.stokBukuId },
				select: { muridId: true },
			});
			const existingIds = existing.map((e) => e.muridId);

			// Kalau ada filter kelasId, ambil murid dari kelas itu saja
			if (input.kelasId) {
				const pendaftaran = await ctx.db.pendaftaranKelas.findMany({
					where: {
						kelasId: input.kelasId,
						status: "AKTIF",
						muridId: { notIn: existingIds },
					},
					include: {
						murid: {
							select: {
								id: true,
								namaLengkap: true,
								kelasSekolah: true,
							},
						},
					},
					orderBy: { murid: { namaLengkap: "asc" } },
				});
				return pendaftaran.map((p) => p.murid);
			}

			// Tanpa filter kelasId — ambil semua murid di cabang
			return ctx.db.murid.findMany({
				where: {
					cabangId: stokBuku.cabangId,
					id: { notIn: existingIds },
				},
				select: { id: true, namaLengkap: true, kelasSekolah: true },
				orderBy: { namaLengkap: "asc" },
			});
		}),

	// =========================
	// GET PENERIMA BY STOK BUKU
	// =========================
	getPenerimaByStokBuku: protectedProcedure
		.input(z.object({ stokBukuId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.penerimaBuku.findMany({
				where: { stokBukuId: input.stokBukuId },
				include: {
					murid: {
						select: {
							id: true,
							namaLengkap: true,
							kelasSekolah: true,
							noWA: true,
						},
					},
					kelas: { select: { id: true, kodeKelas: true, level: true } },
				},
				orderBy: { createdAt: "desc" },
			});
		}),

	// =========================
	// ADD PENERIMA BUKU (assign murid + kelasId)
	// =========================
	addPenerimaBuku: protectedProcedure
		.input(
			z.object({
				stokBukuId: z.string(),
				muridIds: z.array(z.string()).min(1),
				kelasId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.penerimaBuku.createMany({
				data: input.muridIds.map((muridId) => ({
					stokBukuId: input.stokBukuId,
					muridId,
					kelasId: input.kelasId ?? null,
				})),
				skipDuplicates: true,
			});
		}),

	// =========================
	// UPDATE STATUS PENERIMA (admin/manager & guru)
	// Guru hanya bisa update jika dia handle kelas terkait
	// =========================
	updateStatusPenerima: protectedProcedure
		.input(
			z.object({
				penerimaBukuId: z.string(),
				status: z.enum(["BELUM_DIAMBIL", "SUDAH_DIAMBIL"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { role, id: userId } = ctx.session.user;
			const isGuru = role === UserRole.GURU;

			// Guru hanya boleh update kalau dia handle kelasnya
			if (isGuru) {
				const penerima = await ctx.db.penerimaBuku.findUnique({
					where: { id: input.penerimaBukuId },
					select: {
						kelasId: true,
						stokBuku: { select: { statusStok: true } },
					},
				});

				if (penerima?.stokBuku.statusStok !== StatusStokBuku.READY) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Buku belum berstatus READY.",
					});
				}

				if (penerima?.kelasId) {
					const isHandle = await ctx.db.historyGuruKelas.findFirst({
						where: {
							kelasId: penerima.kelasId,
							guruId: userId,
							selesaiPada: null,
						},
					});
					if (!isHandle) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "Kamu tidak mengajar kelas ini.",
						});
					}
				}
			}

			return ctx.db.penerimaBuku.update({
				where: { id: input.penerimaBukuId },
				data: {
					status: input.status,
					tanggalAmbil:
						input.status === StatusPenerimaanBuku.SUDAH_DIAMBIL
							? new Date()
							: null,
				},
			});
		}),

	// =========================
	// DELETE PENERIMA BUKU
	// =========================
	deletePenerimaBuku: protectedProcedure
		.input(z.object({ penerimaBukuId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.penerimaBuku.delete({
				where: { id: input.penerimaBukuId },
			});
		}),

	// =========================
	// GET PENERIMA BUKU UNTUK GURU
	// Hanya tampilkan kalau statusStok = READY dan guru handle kelasnya
	// =========================
	getPenerimaForGuru: protectedProcedure.query(async ({ ctx }) => {
		const guruId = ctx.session.user.id;

		// Ambil semua kelas yang di-handle guru ini (aktif)
		const kelasHandled = await ctx.db.historyGuruKelas.findMany({
			where: { guruId, selesaiPada: null },
			select: { kelasId: true },
		});
		const kelasIds = kelasHandled.map((k) => k.kelasId);

		if (kelasIds.length === 0) return [];

		return ctx.db.penerimaBuku.findMany({
			where: {
				kelasId: { in: kelasIds },
				stokBuku: { statusStok: StatusStokBuku.READY },
			},
			include: {
				murid: { select: { id: true, namaLengkap: true, kelasSekolah: true } },
				kelas: { select: { id: true, kodeKelas: true, level: true } },
				stokBuku: {
					select: {
						jenisKelas: { select: { nama: true } },
						tanggalReady: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}),
});
``;
