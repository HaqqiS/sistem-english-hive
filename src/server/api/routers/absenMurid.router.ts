import { getAbsensiByJadwalSesiIdSchema } from "@/types/absenMurid.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { StatusAbsenMurid } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const absenMuridRouter = createTRPCRouter({
  getAbsensiByJadwalSesiId: protectedProcedure
    .input(getAbsensiByJadwalSesiIdSchema)
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { jadwalSesiId } = input;

      const result = await db.absensiMurid.findMany({
        where: {
          sesiPertemuanKelasId: jadwalSesiId,
        },
        select: {
          id: true,
          status: true,
          muridId: true,
          murid: {
            select: {
              namaLengkap: true,
            },
          },
        },
      });
      return result;
    }),

  getMuridForAbsensi: protectedProcedure
    .input(z.object({ sesiId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { sesiId } = input;

      // 1. Dapatkan info sesi & kelasId
      const sesi = await db.sesiPertemuanKelas.findUnique({
        where: { id: sesiId },
        select: {
          kelasId: true,
          tanggalWaktu: true,
          kelas: { select: { kodeKelas: true } },
        },
      });

      if (!sesi) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sesi tidak ditemukan",
        });
      }

      // 2. Dapatkan semua murid yang terdaftar & aktif di kelas ini
      const pendaftar = await db.pendaftaranKelas.findMany({
        where: {
          kelasId: sesi.kelasId,
          isAktif: true,
        },
        select: {
          murid: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
        },
        orderBy: {
          murid: { namaLengkap: "asc" },
        },
      });

      // 3. Dapatkan data absensi yang SUDAH ADA untuk sesi ini
      const existingAbsensi = await db.absensiMurid.findMany({
        where: {
          sesiPertemuanKelasId: sesiId,
        },
        select: {
          id: true,
          muridId: true,
          status: true,
        },
      });

      // 4. Buat Map untuk lookup absensi
      const absensiMap = new Map(
        existingAbsensi.map((a) => [a.muridId, { id: a.id, status: a.status }]),
      );

      // 5. Gabungkan data
      const muridList = pendaftar.map(({ murid }) => {
        const absensi = absensiMap.get(murid.id);
        return {
          muridId: murid.id,
          namaLengkap: murid.namaLengkap,
          absensiId: absensi?.id ?? null,
          status: absensi?.status ?? null, // Status default jika belum ada
        };
      });

      return {
        sesiInfo: {
          kodeKelas: sesi.kelas.kodeKelas,
          tanggalWaktu: sesi.tanggalWaktu,
        },
        muridList: muridList,
      };
    }),

  createOrUpdateAbsensi: protectedProcedure
    .input(
      z.object({
        sesiId: z.string(),
        muridId: z.string(),
        status: z.nativeEnum(StatusAbsenMurid),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { sesiId, muridId, status } = input;

      // Gunakan upsert: update jika ada, buat baru jika tidak ada.
      // Ini memerlukan @@unique([muridId, sesiPertemuanKelasId]) di schema.prisma
      const absensi = await db.absensiMurid.upsert({
        where: {
          muridId_sesiPertemuanKelasId: {
            muridId: muridId,
            sesiPertemuanKelasId: sesiId,
          },
        },
        update: {
          status: status,
        },
        create: {
          muridId: muridId,
          sesiPertemuanKelasId: sesiId,
          status: status,
        },
      });

      return absensi;
    }),
});
