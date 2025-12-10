"use client";

import { useParams } from "next/navigation";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Banknote,
  CalendarClock,
  CreditCard,
  Terminal,
  User,
} from "lucide-react";
import { usePembayaran } from "@/hooks/usePembayaran";
import { columns as createColumns } from "../columns/columns-pembayaran";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";

export default function HistoryPembayaranMuridClient() {
  const { activeCabangId } = useGlobalCabangStore();
  const { muridId } = useParams<{ muridId: string }>();

  // 1. Gunakan Hook Utama
  const {
    dataGetAll, // List Pembayaran
    isLoadingGetAll,
    isErrorGetAll,
    errorGetAll,
    getSaldoByMuridIdQuery, // Query Saldo Spesifik
  } = usePembayaran({
    enableGetAll: true,
    muridIdFilter: muridId,
    filterCabang: activeCabangId,
  });

  // 2. Panggil Query Saldo (untuk Header & Cards)
  const { data: saldoInfo, isLoading: isLoadingSaldo } = getSaldoByMuridIdQuery(
    { muridId: muridId },

    { enabled: !!muridId },
  );

  // 3. Handler Aksi Tabel (Placeholder / Bisa dihubungkan ke mutasi)
  const columns = createColumns({
    onDeleteClick(item) {
      console.log("Delete clicked for", item);
    },
    onEditClick(item) {
      console.log("Edit clicked for", item);
    },
    onVerifyClick(item) {
      console.log("Verify clicked for", item);
    },
  });

  const isLoading = isLoadingGetAll || isLoadingSaldo;

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        {/* Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        {/* Table Skeleton */}
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // --- ERROR STATE ---
  if (isErrorGetAll) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Gagal memuat data: {errorGetAll?.message}
        </AlertDescription>
      </Alert>
    );
  }

  // --- DATA HELPERS ---
  // Ambil nama murid dari saldoInfo (prioritas) atau dari list pembayaran pertama
  const namaMurid =
    saldoInfo?.muridName ??
    dataGetAll?.[0]?.pendaftaranKelas?.murid?.namaLengkap ??
    "Detail Murid";

  const kodeKelas =
    saldoInfo?.kodeKelas ??
    dataGetAll?.[0]?.pendaftaranKelas?.Kelas?.kodeKelas ??
    "-";

  // Tentukan warna status kuota
  const sisaKuota = saldoInfo?.sisaPertemuan ?? 0;
  const isLowBalance = sisaKuota <= 2;

  return (
    <div className="space-y-6 pb-10">
      {/* --- 1. HEADER SECTION --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Kembali</span>
          </Button> */}
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              {namaMurid}
            </h1>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Badge variant="outline" className="font-normal">
                {kodeKelas}
              </Badge>
              <span>•</span>
              <span>Riwayat Pembayaran</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. SUMMARY CARDS (SALDO INFO) --- */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Sisa Kuota */}
        <Card className={isLowBalance ? "border-red-200 bg-red-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sisa Kuota Pertemuan
            </CardTitle>
            <CalendarClock
              className={`h-4 w-4 ${
                isLowBalance ? "text-red-500" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isLowBalance ? "text-red-600" : ""
              }`}
            >
              {saldoInfo?.sisaPertemuan ?? 0} Sesi
            </div>
            <p className="text-muted-foreground text-xs">
              {isLowBalance
                ? "Kuota menipis, segera buat tagihan."
                : "Kuota pertemuan masih aman."}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Tagihan Berikutnya */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tagihan Berikutnya
            </CardTitle>
            <Banknote className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Ke-{saldoInfo?.nextBillPembayaranKe ?? 1}
            </div>
            <p className="text-muted-foreground text-xs">
              Estimasi tagihan selanjutnya
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Terpakai */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sesi Terpakai
            </CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {saldoInfo?.totalTerpakai ?? 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Total kehadiran & alpa siswa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- 3. TABLE SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Daftar Transaksi
            </h2>
            <p className="text-muted-foreground text-sm">
              History lengkap pembayaran siswa ini.
            </p>
          </div>
          {/* Optional: Tombol Download Invoice / Tambah Manual Khusus Siswa Ini */}
        </div>

        {dataGetAll && dataGetAll.length > 0 ? (
          <DataTable columns={columns} data={dataGetAll} />
        ) : (
          <div className="text-muted-foreground flex h-40 flex-col items-center justify-center gap-2">
            <CreditCard className="h-8 w-8 opacity-50" />
            <p>Belum ada riwayat pembayaran.</p>
          </div>
        )}
      </div>
    </div>
  );
}
