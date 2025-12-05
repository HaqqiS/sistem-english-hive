import type { JenisKelas, PrismaClient, TipeKelas } from "@prisma/client";
import { StatusPembayaran } from "@prisma/client";
import dayjs from "@/utils/dateUtils";
import { JUMLAH_PERTEMUAN_PER_BLOK, BATAS_SESI } from "@/constants/pembayaran";

// Tipe untuk Transaksi Prisma (agar bisa dipakai di dalam tx)
type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface HandleLevelUpParams {
  tx: PrismaTx; // Menerima transaction client
  jadwal: {
    kelasId: string;
    ruangId: string;
    kelas: {
      level: number;
      cohortId: string;
      jenisKelas: string;
      tipe: string;
      grup: string | null;
      hargaKelas: number;
      deskripsi: string | null;
      kodeKelas: string;
      cabangId: string;
    };
  };
}

/**
 * Menangani logika Auto-Generate Level Baru (Trigger di Sesi 20)
 */
export const handleAutoLevelUp = async ({
  tx,
  jadwal,
}: HandleLevelUpParams) => {
  // Hanya jalankan jika level < 4 (Max Level)
  if (jadwal.kelas.level >= 4) return null;

  console.log(
    `[AUTO-GEN] Memulai proses Level Up untuk kelas ${jadwal.kelas.kodeKelas}`,
  );

  // A. Buat Kelas Baru (Level + 1)
  const nextLevel = jadwal.kelas.level + 1;

  const existingClass = await tx.kelas.findFirst({
    where: {
      cohortId: jadwal.kelas.cohortId,
      level: nextLevel,
    },
  });
  if (existingClass) {
    console.log("Kelas level selanjutnya sudah ada, skip pembuatan.");
    return existingClass;
  }

  const newBulanTahun = dayjs().format("MM/YYYY");
  const oldKode = jadwal.kelas.kodeKelas;

  // Logic replace string kode kelas
  const newKodeKelas = oldKode
    .replace(
      `${jadwal.kelas.jenisKelas} ${jadwal.kelas.level}`,
      `${jadwal.kelas.jenisKelas} ${nextLevel}`,
    )
    .replace(/\|\s\d{2}\/\d{4}$/, `| ${newBulanTahun}`);

  const newKelas = await tx.kelas.create({
    data: {
      jenisKelas: jadwal.kelas.jenisKelas as JenisKelas,
      level: nextLevel,
      grup: jadwal.kelas.grup,
      tipe: jadwal.kelas.tipe as TipeKelas,
      bulanTahunAjar: newBulanTahun,
      hargaKelas: jadwal.kelas.hargaKelas,
      deskripsi: jadwal.kelas.deskripsi,
      kodeKelas: newKodeKelas,
      cohortId: jadwal.kelas.cohortId, // PERTAHANKAN COHORT ID
      cabangId: jadwal.kelas.cabangId,
    },
  });

  const prevGuru = await tx.historyGuruKelas.findFirst({
    where: { kelasId: jadwal.kelasId, statusGuru: "ACTIVE" },
  });

  if (prevGuru) {
    await tx.historyGuruKelas.create({
      data: {
        kelasId: newKelas.id,
        guruId: prevGuru.guruId,
        statusGuru: "ACTIVE",
        mulaiPada: dayjs().add(2, "week").format("YYYY-MM-DD"), // Sesuaikan estimasi
      },
    });
  }

  // B. Copy Jadwal Kelas Lama ke Kelas Baru
  const oldJadwals = await tx.jadwalKelas.findMany({
    where: { kelasId: jadwal.kelasId },
  });

  if (oldJadwals.length > 0) {
    const jadwalData = oldJadwals.map((old) => ({
      kelasId: newKelas.id,
      ruangId: old.ruangId,
      hari: old.hari,
      jamSlotTetapId: old.jamSlotTetapId,
      jamSlotCustomId: old.jamSlotCustomId,
    }));

    await tx.jadwalKelas.createMany({
      data: jadwalData,
    });
  }
  // C. Pindahkan Murid Aktif
  const activeStudents = await tx.pendaftaranKelas.findMany({
    where: { kelasId: jadwal.kelasId, isAktif: true },
  });

  const totalTagihan = newKelas.hargaKelas * JUMLAH_PERTEMUAN_PER_BLOK;
  // Tanggal mulai efektif kelas baru = 2 minggu lagi (estimasi)
  const estimasiMulai = dayjs().add(2, "week").toDate();
  const estimasiMulaiString = dayjs(estimasiMulai).format("YYYY-MM-DD");

  // Jalankan semua operasi murid secara bersamaan
  await Promise.all(
    activeStudents.map(async (student) => {
      // A. Buat Pendaftaran Baru
      const newReg = await tx.pendaftaranKelas.create({
        data: {
          muridId: student.muridId,
          kelasId: newKelas.id,
          tanggalMulai: estimasiMulaiString,
          isAktif: true,
        },
      });

      // B. Buat Tagihan PENDING (Linked ke Pendaftaran Baru)
      await tx.pembayaran.create({
        data: {
          pendaftaranKelasId: newReg.id,
          pembayaranKe: 1,
          jumlahBayar: totalTagihan,
          tanggalJatuhTempo: estimasiMulai,
          statusBayar: StatusPembayaran.PENDING,
          note: "Auto-Generate Level Up (Menunggu Konfirmasi)",
        },
      });
    }),
  );

  return newKelas;
};

/**
 * Menangani penutupan kelas lama (Trigger di Sesi 24)
 */
export const handleClassCompletion = async (
  tx: PrismaTx,
  kelasId: string,
  totalSesi: number,
) => {
  if (totalSesi >= BATAS_SESI) {
    console.log(`[AUTO-FINISH] Menutup kelas ID ${kelasId}`);

    // Matikan Pendaftaran Lama
    await tx.pendaftaranKelas.updateMany({
      where: { kelasId: kelasId },
      data: { isAktif: false },
    });

    // Hapus Jadwal Lama
    await tx.jadwalKelas.deleteMany({
      where: { kelasId: kelasId },
    });

    // Set Guru History jadi INACTIVE
    await tx.historyGuruKelas.updateMany({
      where: { kelasId: kelasId, statusGuru: "ACTIVE" },
      data: {
        statusGuru: "INACTIVE",
        selesaiPada: dayjs().format("YYYY-MM-DD"),
      },
    });

    return true; // Selesai
  }
  return false; // Belum selesai
};
