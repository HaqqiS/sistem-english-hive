import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { syncGuruPenerimaBukuForKelas } from "@/server/services/historyGuruKelas.service";
import {
	serverHistoryGuruKelasSchema,
	updateHistoryGuruKelasSchema,
} from "@/types/historyGuruKelas.type";
import { cabangProtectedProcedure, createTRPCRouter } from "../trpc";

export const historyGuruKelasRouter = createTRPCRouter({
	getHistoryGuruByKelasId: cabangProtectedProcedure
		.input(z.object({ kelasId: z.string().min(1, "Kelas ID harus diisi") }))
		.query(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const kelasCheck = await db.kelas.findUnique({
				where: { id: input.kelasId },
				select: { cabangId: true },
			});

			if (!kelasCheck) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Kelas tidak ditemukan.",
				});
			}

			if (allowedCabangId && kelasCheck.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak melihat history guru dari cabang lain.",
				});
			}
			const historyGuruKelas = await db.historyGuruKelas.findMany({
				where: {
					kelasId: input.kelasId,
				},
				orderBy: {
					createdAt: "desc",
				},
				include: {
					guru: true,
				},
			});
			return historyGuruKelas;
		}),

	createHistoryGuruKelas: cabangProtectedProcedure
		.input(serverHistoryGuruKelasSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const kelasCheck = await db.kelas.findUnique({
				where: { id: input.kelasId },
				select: { cabangId: true },
			});

			if (!kelasCheck) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Kelas tidak ditemukan.",
				});
			}

			if (allowedCabangId && kelasCheck.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menugaskan guru di kelas cabang lain.",
				});
			}

			try {
				// DISABLED: Allow double active teacher
				// const existingGuruRecord = await db.historyGuruKelas.findFirst({
				// 	where: {
				// 		kelasId: input.kelasId,
				// 		statusGuru: "ACTIVE",
				// 	},
				// });

				// if (existingGuruRecord) {
				// 	throw new Error(
				// 		"Sudah ada guru yang ditugaskan pada kelas ini dan masih aktif.",
				// 	);
				// }
				const newHistoryGuruKelas = await db.historyGuruKelas.create({
					data: {
						kelasId: input.kelasId,
						guruId: input.guruId,
						statusGuru: input.statusGuru,
						mulaiPada: input.mulaiPada,
						selesaiPada: input.selesaiPada,
					},
				});

				// Sinkronkan tautan buku ke semua guru aktif di kelas ini.
				if (newHistoryGuruKelas.statusGuru === "ACTIVE") {
					const activeGuruIds = await db.historyGuruKelas.findMany({
						where: {
							kelasId: input.kelasId,
							statusGuru: "ACTIVE",
							selesaiPada: null,
						},
						select: { guruId: true },
					});
					await syncGuruPenerimaBukuForKelas(
						db,
						input.kelasId,
						activeGuruIds.map((item) => item.guruId),
					);
				}

				return newHistoryGuruKelas;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					// P2003: Foreign Key Violation (KelasId atau GuruId tidak ada di DB)
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Data Kelas atau Guru tidak valid/tidak ditemukan.",
						});
					}
				}
				throw error;
			}
		}),

	updateHistoryGuruKelas: cabangProtectedProcedure
		.input(
			updateHistoryGuruKelasSchema.extend({
				id: z.string().min(1, "ID harus diisi"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			try {
				const oldRecord = await db.historyGuruKelas.findUnique({
					where: { id: input.id },
					include: { kelas: { select: { cabangId: true } } },
				});

				if (!oldRecord) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "History tidak ditemukan.",
					});
				}

				if (allowedCabangId && oldRecord.kelas.cabangId !== allowedCabangId) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Anda tidak berhak mengubah data cabang lain.",
					});
				}

				if (input.guruId === oldRecord?.guruId) {
					const updatedRecord = await db.historyGuruKelas.update({
						where: { id: input.id },
						data: {
							// Hanya update fields selain guruId
							mulaiPada: input.mulaiPada,
						},
					});

					if (updatedRecord.statusGuru === "ACTIVE") {
						const activeGuruIds = await db.historyGuruKelas.findMany({
							where: {
								kelasId: oldRecord.kelasId,
								statusGuru: "ACTIVE",
								selesaiPada: null,
							},
							select: { guruId: true },
						});
						await syncGuruPenerimaBukuForKelas(
							db,
							oldRecord.kelasId,
							activeGuruIds.map((item) => item.guruId),
						);
					}

					return updatedRecord;
				} else {
					// Tutup record lama
					await db.historyGuruKelas.update({
						where: { id: input.id },
						data: {
							selesaiPada: new Date().toISOString().split("T")[0], // format "YYYY-MM-DD"
							statusGuru: "INACTIVE",
						},
					});
					// Buat record baru
					const newRecord = await db.historyGuruKelas.create({
						data: {
							kelasId: oldRecord?.kelasId ?? "",
							guruId: input.guruId,
							statusGuru: "ACTIVE",
							mulaiPada: input.mulaiPada,
						},
					});

					if (oldRecord?.kelasId) {
						const activeGuruIds = await db.historyGuruKelas.findMany({
							where: {
								kelasId: oldRecord.kelasId,
								statusGuru: "ACTIVE",
								selesaiPada: null,
							},
							select: { guruId: true },
						});
						await syncGuruPenerimaBukuForKelas(
							db,
							oldRecord.kelasId,
							activeGuruIds.map((item) => item.guruId),
						);
					}

					return newRecord;
				}
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Data history guru tidak ditemukan saat ingin diupdate.",
						});
					}
					if (error.code === "P2003") {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Guru pengganti tidak valid.",
						});
					}
				}
				throw error;
			}
		}),

	deleteHistoryGuruKelas: cabangProtectedProcedure
		.input(
			z.object({
				id: z.string().cuid("Id Tidak Valid"),
				kelasId: z.string().min(1, "Kelas ID harus diisi"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const record = await db.historyGuruKelas.findUnique({
				where: { id: input.id },
				include: { kelas: { select: { cabangId: true } } },
			});

			if (!record) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data tidak ditemukan.",
				});
			}

			if (allowedCabangId && record.kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak menghapus data dari cabang lain.",
				});
			}

			try {
				const deletedRecord = await db.historyGuruKelas.delete({
					where: { id: input.id },
				});

				if (deletedRecord.statusGuru === "ACTIVE") {
					const activeGuruIds = await db.historyGuruKelas.findMany({
						where: {
							kelasId: input.kelasId,
							statusGuru: "ACTIVE",
							selesaiPada: null,
						},
						select: { guruId: true },
					});
					await syncGuruPenerimaBukuForKelas(
						db,
						input.kelasId,
						activeGuruIds.map((item) => item.guruId),
					);
				}

				return deletedRecord;
			} catch (error) {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === "P2025") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Data history sudah dihapus atau tidak ditemukan.",
						});
					}
				}
				throw error;
			}
		}),

	toggleStatusHistoryGuruKelas: cabangProtectedProcedure
		.input(
			z.object({
				id: z.string().cuid("Id Tidak Valid"),
				status: z.enum(["ACTIVE", "INACTIVE"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, allowedCabangId } = ctx;

			const record = await db.historyGuruKelas.findUnique({
				where: { id: input.id },
				include: { kelas: { select: { cabangId: true } } },
			});

			if (!record) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Data tidak ditemukan.",
				});
			}

			if (allowedCabangId && record.kelas.cabangId !== allowedCabangId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Anda tidak berhak mengubah data dari cabang lain.",
				});
			}

			// Logic: Jika INACTIVE -> Set selesaiPada hari ini. Jika ACTIVE -> Clear selesaiPada
			const selesaiPada =
				input.status === "INACTIVE"
					? new Date().toISOString().split("T")[0]
					: null;

			const updatedRecord = await db.historyGuruKelas.update({
				where: { id: input.id },
				data: {
					statusGuru: input.status,
					selesaiPada: selesaiPada,
				},
			});

			const activeGuruIds = await db.historyGuruKelas.findMany({
				where: {
					kelasId: record.kelasId,
					statusGuru: "ACTIVE",
					selesaiPada: null,
				},
				select: { guruId: true },
			});
			await syncGuruPenerimaBukuForKelas(
				db,
				record.kelasId,
				activeGuruIds.map((item) => item.guruId),
			);

			return updatedRecord;
		}),
});
