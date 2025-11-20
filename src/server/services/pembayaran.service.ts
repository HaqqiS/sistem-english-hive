import type { PrismaClient } from "@prisma/client";
import { StatusPembayaran, StatusAbsenMurid } from "@prisma/client";
import {
  JUMLAH_PERTEMUAN_PER_BLOK,
  BATAS_SISA_UNTUK_TAGIHAN,
} from "@/constants/pembayaran";

// Definisi tipe kembalian agar TypeScript tidak bingung
type BillingStatus = {
  muridName: string;
  kodeKelas: string;
  totalKuotaSesi: number;
  totalTerpakai: number;
  sisaPertemuan: number;
  needNewBill: boolean;
  nextBillPembayaranKe: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendaftaranData: any; // Bisa diperjelas dengan tipe PendaftaranKelas Prisma jika perlu
  hargaPerSesi: number; // Pastikan ini number, bukan number | undefined
  paketPertemuan: number;
};

export const calculateSisaPertemuan = async (
  db: PrismaClient,
  pendaftaranKelasId: string,
): Promise<BillingStatus> => {
  // 1. Ambil Data Pendaftaran
  const pendaftaran = await db.pendaftaranKelas.findUnique({
    where: { id: pendaftaranKelasId },
    include: {
      Kelas: {
        select: { hargaKelas: true, id: true, kodeKelas: true },
      },
      murid: {
        select: { id: true, namaLengkap: true },
      },
    },
  });

  if (!pendaftaran) {
    throw new Error("Data pendaftaran tidak ditemukan");
  }

  // Pastikan nilai default aman
  const hargaPerSesi = pendaftaran.Kelas?.hargaKelas ?? 0;
  const kodeKelas = pendaftaran.Kelas?.kodeKelas ?? "Unknown Class";
  const muridName = pendaftaran.murid?.namaLengkap ?? "Unknown Student";
  const paketPertemuan = JUMLAH_PERTEMUAN_PER_BLOK;

  if (hargaPerSesi <= 0) {
    return {
      muridName,
      kodeKelas,
      totalKuotaSesi: 0,
      totalTerpakai: 0,
      sisaPertemuan: 999, // Unlimited
      needNewBill: false,
      nextBillPembayaranKe: 0,
      pendaftaranData: pendaftaran,
      hargaPerSesi: 0,
      paketPertemuan,
    };
  }

  // 2. HITUNG KREDIT (Total Sesi yang SUDAH DIBAYAR LUNAS)
  const pembayaranLunas = await db.pembayaran.findMany({
    where: {
      pendaftaranKelasId: pendaftaranKelasId,
      statusBayar: StatusPembayaran.LUNAS,
    },
    select: { jumlahBayar: true },
  });

  const totalUangMasuk = pembayaranLunas.reduce(
    (acc, curr) => acc + curr.jumlahBayar,
    0,
  );

  const totalKuotaSesi = Math.floor(totalUangMasuk / hargaPerSesi);

  // 3. HITUNG DEBIT (Total Sesi yang SUDAH DIGUNAKAN)
  const totalTerpakai = await db.absensiMurid.count({
    where: {
      muridId: pendaftaran.muridId,
      sesiPertemuanKelas: {
        kelasId: pendaftaran.kelasId,
      },
      status: {
        in: [StatusAbsenMurid.HADIR, StatusAbsenMurid.ALPA],
      },
    },
  });

  // 4. Kalkulasi Sisa
  const sisaPertemuan = totalKuotaSesi - totalTerpakai;

  // 5. Cek Trigger Tagihan
  let needNewBill = false;
  let nextBillPembayaranKe = 0;

  if (sisaPertemuan <= BATAS_SISA_UNTUK_TAGIHAN) {
    const existingPendingBill = await db.pembayaran.findFirst({
      where: {
        pendaftaranKelasId: pendaftaranKelasId,
        statusBayar: {
          in: [StatusPembayaran.BELUM_LUNAS, StatusPembayaran.PENDING],
        },
      },
    });

    if (!existingPendingBill) {
      needNewBill = true;
      const totalTagihanDibuat = await db.pembayaran.count({
        where: { pendaftaranKelasId: pendaftaranKelasId },
      });
      nextBillPembayaranKe = totalTagihanDibuat + 1;
    }
  }

  return {
    muridName,
    kodeKelas,
    totalKuotaSesi,
    totalTerpakai,
    sisaPertemuan,
    needNewBill,
    nextBillPembayaranKe,
    pendaftaranData: pendaftaran,
    hargaPerSesi,
    paketPertemuan,
  };
};
