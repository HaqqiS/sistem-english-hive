import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { UserRole } from "@/server/auth/type";

export const finalReportRouter = createTRPCRouter({
	// =========================
	// GET KELAS BY CABANG GURU
	// =========================
	getKelasByCabangGuru: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { cabangId: true },
		});

		if (!user?.cabangId) return [];

		return ctx.db.kelas.findMany({
			where: {
				cabangId: user.cabangId,
				statusKelas: { not: "COMPLETED" },
				historyGuruKelases: {
					some: {
						guruId: ctx.session.user.id,
						selesaiPada: null,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				level: true,
				kodeKelas: true,
				jenisKelasRel: {
					select: { nama: true },
				},
				pendaftaranKelases: {
					where: { status: "AKTIF" },
					select: {
						id: true,
						murid: {
							select: {
								id: true,
								namaLengkap: true,
							},
						},
					},
				},
			},
		});
	}),

	// =========================
	// GET KELAS BY CABANG FILTER (untuk ADMIN/MANAGER)
	// Ambil semua kelas dari cabang yang sedang difilter (activeCabangId di sidebar),
	// lengkap dengan daftar guru per kelas untuk dipilih manual saat submit FR.
	// =========================
	getKelasByCabangFilter: protectedProcedure
		.input(
			z.object({
				cabangId: z.string().optional(), // undefined / "ALL" artinya semua cabang
			}),
		)
		.query(async ({ ctx, input }) => {
			const { role, cabangId: userCabangId } = ctx.session.user;

			// ADMIN selalu dibatasi ke cabangnya sendiri, walau filter cabang diabaikan
			const targetCabangId =
				role === UserRole.MANAGER ? input.cabangId : userCabangId;

			return ctx.db.kelas.findMany({
				where: {
					...(targetCabangId ? { cabangId: targetCabangId } : {}),
					statusKelas: { not: "COMPLETED" },
				},
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					level: true,
					kodeKelas: true,
					jenisKelasRel: {
						select: { nama: true },
					},
					pendaftaranKelases: {
						where: { status: "AKTIF" },
						select: {
							id: true,
							murid: {
								select: {
									id: true,
									namaLengkap: true,
								},
							},
						},
					},
					historyGuruKelases: {
						where: { selesaiPada: null },
						select: {
							guru: {
								select: { id: true, name: true },
							},
						},
					},
				},
			});
		}),

	// =========================
	// GET ATTENDANCE BY MURID & KELAS
	// Hitung kehadiran (HADIR) murid di kelas tertentu dari AbsensiMurid
	// =========================
	getAttendanceByMuridKelas: protectedProcedure
		.input(
			z.object({
				muridId: z.string(),
				kelasId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const hadirCount = await ctx.db.absensiMurid.count({
				where: {
					muridId: input.muridId,
					sesiPertemuanKelas: { kelasId: input.kelasId },
					status: "HADIR",
				},
			});

			const totalSesi = await ctx.db.sesiPertemuanKelas.count({
				where: { kelasId: input.kelasId },
			});

			return { hadirCount, totalSesi };
		}),

	// =========================
	// CREATE
	// GURU: submit FR sendiri, status PENDING, menunggu approval admin.
	// ADMIN/MANAGER: bisa pilih guru manual (teacherUserId), status langsung APPROVED.
	// =========================
	create: protectedProcedure
		.input(
			z.object({
				studentName: z.string(),
				studentId: z.string().optional(),
				level: z.string(),
				midTest: z.number(),
				finalTest: z.number(),
				listening: z.number(),
				speaking: z.number(),
				reading: z.number(),
				writing: z.number(),
				recording: z.number(),
				attendance: z.number(),
				projectParticipation: z.number(),
				finalScore: z.number(),
				notes: z.string().optional(),
				graduationDate: z.date().optional(),
				// Hanya dipakai ADMIN/MANAGER saat submit atas nama guru lain
				teacherUserId: z.string().optional(),
				teacherName: z.string().optional(),
				// Hanya dipakai ADMIN/MANAGER. MANAGER wajib pilih,
				// ADMIN otomatis dari cabangnya sendiri jika tidak dikirim.
				cabangId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { role, cabangId: userCabangId } = ctx.session.user;
			const isStaff = role === UserRole.ADMIN || role === UserRole.MANAGER;
			const { teacherUserId, teacherName, cabangId, ...rest } = input;

			// Staff (ADMIN/MANAGER) wajib pilih guru manual
			if (isStaff && (!teacherUserId || !teacherName)) {
				throw new Error("Guru wajib dipilih sebelum mengirim Final Report");
			}

			// Resolve cabang info untuk dicetak di laporan (hanya berlaku saat APPROVED / staff submit)
			let cabangInfo: {
				cabangNama?: string;
				cabangAlamat?: string;
				cabangNoTelp?: string;
				cabangEmail?: string;
			} = {};

			if (isStaff) {
				// MANAGER wajib pilih cabang manual. ADMIN otomatis pakai cabangnya sendiri.
				const targetCabangId =
					role === UserRole.MANAGER ? cabangId : userCabangId;

				if (role === UserRole.MANAGER && !targetCabangId) {
					throw new Error("Cabang wajib dipilih sebelum mengirim Final Report");
				}

				if (targetCabangId) {
					const cabang = await ctx.db.cabang.findUnique({
						where: { id: targetCabangId },
						select: {
							namaCabang: true,
							alamat: true,
							noTelp: true,
							email: true,
						},
					});

					if (cabang) {
						cabangInfo = {
							cabangNama: cabang.namaCabang,
							cabangAlamat: cabang.alamat ?? undefined,
							cabangNoTelp: cabang.noTelp ?? undefined,
							cabangEmail: cabang.email ?? undefined,
						};
					}
				}
			}

			return ctx.db.finalReport.create({
				data: {
					...rest,
					...cabangInfo,
					teacherUserId: isStaff
						? (teacherUserId as string)
						: ctx.session.user.id,
					teacherName: isStaff
						? (teacherName as string)
						: (ctx.session.user.name ?? "Unknown"),
					// Staff yang submit langsung approved, guru tetap PENDING
					status: isStaff ? "APPROVED" : "PENDING",
				},
			});
		}),

	// =========================
	// GET ALL
	// MANAGER: semua FR, atau filter berdasarkan cabangId yang dipilih.
	// ADMIN: hanya FR dari guru yang satu cabang dengannya.
	// =========================
	getAll: protectedProcedure
		.input(
			z
				.object({
					cabangId: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const { role, cabangId } = ctx.session.user;

			// MANAGER melihat semua, atau hanya cabang yang dipilih (filter)
			if (role === UserRole.MANAGER) {
				const filterCabangId = input?.cabangId;

				if (filterCabangId) {
					const guruDiCabang = await ctx.db.user.findMany({
						where: { cabangId: filterCabangId },
						select: { id: true },
					});
					const guruIds = guruDiCabang.map((g) => g.id);

					return ctx.db.finalReport.findMany({
						where: { teacherUserId: { in: guruIds } },
						orderBy: { createdAt: "desc" },
					});
				}

				return ctx.db.finalReport.findMany({
					orderBy: { createdAt: "desc" },
				});
			}

			// ADMIN hanya melihat FR guru di cabangnya
			if (!cabangId) return [];

			// Ambil ID semua guru yang terdaftar di cabang ini
			const guruDiCabang = await ctx.db.user.findMany({
				where: { cabangId },
				select: { id: true },
			});
			const guruIds = guruDiCabang.map((g) => g.id);

			return ctx.db.finalReport.findMany({
				where: { teacherUserId: { in: guruIds } },
				orderBy: { createdAt: "desc" },
			});
		}),

	// =========================
	// GET PENDING BY GURU
	// =========================
	getPendingByGuru: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.finalReport.findMany({
			where: {
				teacherUserId: ctx.session.user.id,
				status: "PENDING",
			},
			orderBy: { createdAt: "desc" },
		});
	}),

	// =========================
	// GET APPROVED BY GURU
	// =========================
	getApprovedByGuru: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.finalReport.findMany({
			where: {
				teacherUserId: ctx.session.user.id,
				status: "APPROVED",
				isPrinted: false,
			},
			orderBy: { createdAt: "desc" },
		});
	}),

	// =========================
	// GET CABANG FOR APPROVAL
	// MANAGER: semua cabang (bisa pilih bebas).
	// ADMIN: hanya cabang mereka sendiri.
	// =========================
	getCabangForApproval: protectedProcedure.query(async ({ ctx }) => {
		const { role, cabangId } = ctx.session.user;

		if (role === UserRole.MANAGER) {
			return ctx.db.cabang.findMany({
				select: {
					id: true,
					namaCabang: true,
					alamat: true,
					noTelp: true,
					email: true,
				},
				orderBy: { namaCabang: "asc" },
			});
		}

		// ADMIN: kembalikan hanya cabang sendiri (array satu item, konsisten dengan manager)
		if (!cabangId) return [];

		return ctx.db.cabang.findMany({
			where: { id: cabangId },
			select: {
				id: true,
				namaCabang: true,
				alamat: true,
				noTelp: true,
				email: true,
			},
		});
	}),

	// =========================
	// UPDATE STATUS + CABANG INFO
	// =========================
	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
				cabangNama: z.string().optional(),
				cabangAlamat: z.string().optional(),
				cabangNoTelp: z.string().optional(),
				cabangEmail: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, status, ...cabangData } = input;
			return ctx.db.finalReport.update({
				where: { id },
				data: {
					status,
					...(status === "APPROVED" ? cabangData : {}),
				},
			});
		}),

	// =========================
	// MARK AS PRINTED
	// =========================
	markAsPrinted: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.finalReport.update({
				where: { id: input.id },
				data: { isPrinted: true },
			});
		}),

	// =========================
	// DELETE
	// =========================
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.finalReport.delete({
				where: { id: input.id },
			});
		}),
});
