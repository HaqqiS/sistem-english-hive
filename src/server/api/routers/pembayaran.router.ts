import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import dayjs from "@/utils/dateUtils";
import { Prisma, StatusPembayaran } from "@prisma/client";
import { UserRole } from "@/server/auth/type";
import { TRPCError } from "@trpc/server";
import { calculateSisaPertemuan } from "@/server/services/pembayaran.service";
import {
  createPembayaranSchema,
  updatePembayaranSchema,
} from "@/types/pembayaran.type";
import { paginationSchema } from "@/types/pagination.type";

export const pembayaranRouter = createTRPCRouter({
  // 1. GET ALL (Dengan Filter Opsional)
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(StatusPembayaran).optional(),
          muridId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const whereClause: Prisma.PembayaranWhereInput = {};

      if (input?.status) whereClause.statusBayar = input.status;
      if (input?.muridId)
        whereClause.pendaftaranKelas = { muridId: input.muridId };

      return db.pembayaran.findMany({
        where: whereClause,
        orderBy: { tanggalJatuhTempo: "desc" }, // Urutkan yang terbaru
        include: {
          pendaftaranKelas: {
            include: {
              murid: { select: { namaLengkap: true, noWA: true } },
              Kelas: { select: { kodeKelas: true, hargaKelas: true } },
            },
          },
          verifiedBy: { select: { name: true } }, // Lihat siapa admin yang verifikasi
        },
      });
    }),

  getAllPaginated: protectedProcedure
    .input(
      paginationSchema.extend({
        status: z.nativeEnum(StatusPembayaran).optional(),
        muridId: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { pageIndex, pageSize } = input;

      const whereClause: Prisma.PembayaranWhereInput = {};

      if (input.status && input.status !== ("ALL" as StatusPembayaran)) {
        whereClause.statusBayar = input.status;
      }
      if (input.muridId || input.search) {
        whereClause.pendaftaranKelas = {
          ...(input.muridId ? { muridId: input.muridId } : {}),

          // Jika ada search, filter partial match pada nama murid
          ...(input.search
            ? {
                murid: {
                  namaLengkap: {
                    contains: input.search,
                    mode: "insensitive", // Agar tidak case-sensitive (Huruf besar/kecil dianggap sama)
                  },
                },
              }
            : {}),
        };
      }

      // Transaction untuk performa lebih baik (count + findMany)
      const [total, data] = await db.$transaction([
        db.pembayaran.count({ where: whereClause }),
        db.pembayaran.findMany({
          skip: pageIndex * pageSize,
          take: pageSize,
          where: whereClause,
          orderBy: { tanggalJatuhTempo: "desc" },
          include: {
            pendaftaranKelas: {
              include: {
                murid: { select: { namaLengkap: true, noWA: true } },
                Kelas: { select: { kodeKelas: true, hargaKelas: true } },
              },
            },
            verifiedBy: { select: { name: true } },
          },
        }),
      ]);

      const pageCount = Math.ceil(total / pageSize);

      return {
        data,
        pageCount,
        total,
      };
    }),

  // 2. GET TAGIHAN JATUH TEMPO (Untuk Dashboard)
  getTagihanJatuhTempo: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const HARI_INI = dayjs().startOf("day");
    const DUA_MINGGU_LAGI = dayjs().add(14, "day").endOf("day");

    return db.pembayaran.findMany({
      where: {
        statusBayar: {
          in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
        },
        tanggalJatuhTempo: {
          gte: HARI_INI.toDate(),
          lte: DUA_MINGGU_LAGI.toDate(),
        },
      },
      orderBy: { tanggalJatuhTempo: "asc" },
      include: {
        pendaftaranKelas: {
          include: {
            murid: { select: { namaLengkap: true, noWA: true } },
            Kelas: { select: { kodeKelas: true } },
          },
        },
      },
    });
  }),

  // 3. [BARU] GET SALDO SISWA (Real-time Calculation)
  // Digunakan di halaman detail pembayaran atau detail murid untuk melihat kesehatan akun
  // getSaldoSiswa: protectedProcedure
  //   .input(z.object({ pendaftaranKelasId: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     const { db } = ctx;

  //     // Panggil Helper Service yang sudah kita buat
  //     const saldoInfo = await calculateSisaPertemuan(
  //       db,
  //       input.pendaftaranKelasId,
  //     );

  //     return saldoInfo;
  //   }),

  getSaldoByMuridId: protectedProcedure
    .input(z.object({ muridId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;

      const pendaftaranAktif = await db.pendaftaranKelas.findFirst({
        where: {
          muridId: input.muridId,
          isAktif: true, // Pastikan hanya ambil yang aktif
        },
        select: { id: true },
      });

      if (!pendaftaranAktif) {
        return null;
      }

      return await calculateSisaPertemuan(db, pendaftaranAktif.id);
    }),

  updatePembayaran: protectedProcedure
    .input(updatePembayaranSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // 1. Authorization Check
      if (
        session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.MANAGER
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Hanya Admin atau Manager yang dapat mengupdate data pembayaran.",
        });
      }

      try {
        // 2. Retrieve existing data to handle conditional logic
        const existingPayment = await db.pembayaran.findUnique({
          where: { id: input.id },
        });

        if (!existingPayment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data pembayaran tidak ditemukan.",
          });
        }

        // 3. Prepare update data
        const updateData: Prisma.PembayaranUpdateInput = {
          jumlahBayar: input.jumlahBayar,
          note: input.note,
          statusBayar: input.statusBayar,
        };

        // Logic: Handling Status Changes
        if (input.statusBayar === StatusPembayaran.LUNAS) {
          updateData.verifiedBy = { connect: { id: session.user.id } };
          updateData.tanggalBayar = input.tanggalBayar ?? new Date();
        } else {
          updateData.verifiedBy = { disconnect: true };
          updateData.tanggalBayar = null;
        }

        const updated = await db.pembayaran.update({
          where: { id: input.id },
          data: updateData,
        });

        return updated;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Pembayaran tidak ditemukan atau sudah dihapus.",
            });
          }
        }
        throw error;
      }
    }),

  // 5. [BARU] CREATE TAGIHAN MANUAL
  // Jika admin perlu membuat tagihan di luar siklus otomatis
  createManualTagihan: protectedProcedure
    .input(createPembayaranSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const tanggalTransaksi = input.tanggalBayar ?? new Date();

      try {
        let urutan = input.pembayaranKe;
        if (!urutan) {
          const lastBill = await db.pembayaran.findFirst({
            where: { pendaftaranKelasId: input.pendaftaranKelasId },
            orderBy: { pembayaranKe: "desc" },
          });
          urutan = (lastBill?.pembayaranKe ?? 0) + 1;
        }

        return db.pembayaran.create({
          data: {
            pendaftaranKelasId: input.pendaftaranKelasId,
            jumlahBayar: input.jumlahBayar,
            tanggalJatuhTempo: tanggalTransaksi,
            tanggalBayar: tanggalTransaksi,
            pembayaranKe: urutan,
            statusBayar: StatusPembayaran.LUNAS,
            verifiedById: session.user.id,
            note: input.note ?? "Tagihan Manual Admin",
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2002: Konflik pada [pendaftaranKelasId, pembayaranKe]
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Tagihan ke-${input.pembayaranKe ?? "?"} sudah ada untuk siswa ini. Harap cek kembali urutan pembayaran.`,
            });
          }
          // P2003: Pendaftaran ID salah
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Data Pendaftaran Siswa tidak valid.",
            });
          }
        }
        throw error;
      }
    }),

  // 6. DELETE TAGIHAN
  // Hati-hati, menghapus tagihan LUNAS akan mengurangi saldo pertemuan siswa!
  deletePembayaran: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      if (session.user.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Hanya Admin yang boleh menghapus data pembayaran.",
        });
      }

      try {
        return await db.pembayaran.delete({
          where: { id: input.id },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Pembayaran sudah dihapus atau tidak ditemukan.",
            });
          }
        }
        throw error;
      }
    }),
});
