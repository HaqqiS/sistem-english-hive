import { serverSesiPertemuanSchema } from "@/types/sesiPertemuan.type";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { Prisma, type StatusAbsenMurid } from "@prisma/client";

export const sesiPertemuanRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const sesiPertemuan = await db.sesiPertemuanKelas.findMany({
      select: {
        id: true,
        kelasId: true,
        kelas: {
          select: {
            kodeKelas: true,
          },
        },
        // ruangId: true,
        // ruang: { select: { namaRuang: true } },
        tanggalWaktu: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sesiPertemuan;
  }),

  getSesiSummaryByKelasId: protectedProcedure
    .input(z.object({ kelasId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { kelasId } = input;

      // 1. Dapatkan Info Kelas dan Guru Aktif
      const kelasInfo = await db.kelas.findUnique({
        where: { id: kelasId },
        select: {
          kodeKelas: true,
          historyGuruKelases: {
            where: { statusGuru: "ACTIVE" },
            select: {
              guru: { select: { name: true } },
            },
            take: 1,
          },
        },
      });

      if (!kelasInfo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kelas tidak ditemukan.",
        });
      }

      // 2. Dapatkan Daftar Siswa yg pernah terdaftar di kelas ini
      const students = await db.pendaftaranKelas.findMany({
        where: {
          kelasId: kelasId,
          //  isAktif: true
        },
        select: {
          murid: {
            select: { id: true, namaLengkap: true },
          },
        },
        orderBy: { murid: { namaLengkap: "asc" } },
      });

      // 3. Dapatkan Daftar Sesi (Kolom)
      const sessions = await db.sesiPertemuanKelas.findMany({
        where: { kelasId: kelasId },
        select: {
          id: true,
          tanggalWaktu: true,
          absensiGurus: {
            select: {
              guru: { select: { name: true } },
            },
            take: 1,
          },
        },
        orderBy: { tanggalWaktu: "asc" },
      });

      // 4. Dapatkan SEMUA data absensi murid untuk kelas ini
      const allAbsensi = await db.absensiMurid.findMany({
        where: {
          sesiPertemuanKelas: {
            kelasId: kelasId,
          },
        },
        select: {
          muridId: true,
          sesiPertemuanKelasId: true,
          status: true,
        },
      });

      // 5. Olah data untuk Front-end
      // Buat Peta Absensi: Map<muridId, Map<sesiId, status>>
      const absensiMap = new Map<string, Map<string, StatusAbsenMurid>>();
      for (const absen of allAbsensi) {
        if (!absensiMap.has(absen.muridId)) {
          absensiMap.set(absen.muridId, new Map());
        }
        absensiMap
          .get(absen.muridId)!
          .set(absen.sesiPertemuanKelasId, absen.status);
      }

      // Siapkan data kolom
      const columnData = sessions.map((sesi, index) => ({
        sesiId: sesi.id,
        tanggal: sesi.tanggalWaktu,
        pertemuanKe: `Pertemuan ${index + 1}`,
        pengajar: sesi.absensiGurus[0]?.guru.name ?? "N/A",
      }));

      // Siapkan data baris
      const rowData = students.map((p) => {
        const studentId = p.murid.id;
        const studentAbsenMap = absensiMap.get(studentId);

        // Buat absensi untuk setiap sesi
        const attendance = sessions.reduce(
          (acc, sesi) => {
            acc[sesi.id] = studentAbsenMap?.get(sesi.id) ?? null;
            return acc;
          },
          {} as Record<string, StatusAbsenMurid | null>,
        );

        return {
          studentId: studentId,
          namaSiswa: p.murid.namaLengkap,
          attendance, // { sesi1Id: "HADIR", sesi2Id: "ALPA", ... }
        };
      });

      return {
        kelasInfo: {
          kodeKelas: kelasInfo.kodeKelas,
          guruAktif: kelasInfo.historyGuruKelases[0]?.guru.name ?? "Belum ada",
        },
        columnData, // Daftar kolom (sesi)
        rowData, // Daftar baris (siswa)
      };
    }),

  createSesiPertemuan: protectedProcedure
    .input(serverSesiPertemuanSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      try {
        return await db.sesiPertemuanKelas.create({
          data: {
            kelasId: input.kelasId,
            ruangId: input.ruangId,
            tanggalWaktu: input.tanggalWaktu,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2003: Foreign Key (Kelas atau Ruang tidak valid)
          if (error.code === "P2003") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Gagal membuat sesi: Kelas atau Ruang yang dipilih tidak valid.",
            });
          }
        }
        throw error;
      }
    }),
});
