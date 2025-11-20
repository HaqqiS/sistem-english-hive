import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import dayjs from "@/utils/dateUtils";
import { StatusPembayaran, type Prisma } from "@prisma/client";
import { UserRole } from "@/server/auth/type";
import { TRPCError } from "@trpc/server";
import { calculateSisaPertemuan } from "@/server/services/pembayaran.service";
import { updatePembayaranSchema } from "@/types/pembayaran.type";

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
  getSaldoSiswa: protectedProcedure
    .input(z.object({ pendaftaranKelasId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;

      // Panggil Helper Service yang sudah kita buat
      const saldoInfo = await calculateSisaPertemuan(
        db,
        input.pendaftaranKelasId,
      );

      return saldoInfo;
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
      // Use 'any' temporarily to build the object dynamically if needed, or better, strict typing
      const updateData: {
        jumlahBayar: number;
        note?: string | null;
        statusBayar: StatusPembayaran;
        tanggalBayar?: Date | null;
        verifiedById?: string | null;
      } = {
        jumlahBayar: input.jumlahBayar,
        note: input.note,
        statusBayar: input.statusBayar,
      };

      // Logic: Handling Status Changes
      if (input.statusBayar === StatusPembayaran.LUNAS) {
        // If becoming LUNAS:
        // - Set verifiedBy to current user
        // - Set tanggalBayar (use input or default to now if missing)
        updateData.verifiedById = session.user.id;
        updateData.tanggalBayar = input.tanggalBayar ?? new Date();
      } else {
        // If changing to BELUM_LUNAS or PENDING:
        // - Clear verification info? Usually yes, to indicate it's not valid yet.
        // - Clear tanggalBayar? Yes.
        updateData.verifiedById = null;
        updateData.tanggalBayar = null;
      }

      const updated = await db.pembayaran.update({
        where: { id: input.id },
        data: updateData,
      });

      return updated;
    }),

  // 5. [BARU] CREATE TAGIHAN MANUAL
  // Jika admin perlu membuat tagihan di luar siklus otomatis
  createManualTagihan: protectedProcedure
    .input(
      z.object({
        pendaftaranKelasId: z.string(),
        jumlahBayar: z.number().min(1),
        tanggalJatuhTempo: z.date(),
        note: z.string().optional(),
        pembayaranKe: z.number().optional(), // Opsional, kalau mau override urutan
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      // Jika pembayaranKe tidak diisi, cari urutan terakhir + 1
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
          tanggalJatuhTempo: input.tanggalJatuhTempo,
          pembayaranKe: urutan,
          statusBayar: StatusPembayaran.BELUM_LUNAS,
          note: input.note ?? "Tagihan Manual Admin",
        },
      });
    }),

  // 6. DELETE TAGIHAN
  // Hati-hati, menghapus tagihan LUNAS akan mengurangi saldo pertemuan siswa!
  deletePembayaran: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      // Proteksi ekstra
      if (session.user.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      return db.pembayaran.delete({
        where: { id: input.id },
      });
    }),
});
