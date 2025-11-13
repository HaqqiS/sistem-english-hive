"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { useUser } from "@/hooks/useUser"; // Untuk mengambil nama guru
import { DataTable } from "@/app/_components/shared/data-table"; // Ganti ke data-table.tsx
import { columns } from "../columns/columns-detail-absen-guru";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toRupiah } from "@/utils/toRupiah";
import dayjs from "@/utils/dateUtils";
import { AlertCircle, CalendarIcon, Check, Users } from "lucide-react";
import { StatusAbsenGuru } from "@prisma/client";

// --- Gaji per absensi ---
const GAJI_PER_SESI = 50000;

export default function DetailGuruClient() {
  const { guruId } = useParams<{ guruId: string }>();
  const [open, setOpen] = useState(false);

  // State untuk menyimpan bulan terpilih (format YYYY-MM)
  const [month, setMonth] = useState<Date | undefined>(new Date());
  const selectedMonthYYYYMM = dayjs(month).format("YYYY-MM");

  // 1. Query untuk mendapatkan nama guru
  const { data: dataGuru, isLoading: isLoadingGuru } = useUser();

  // 2. Query untuk mendapatkan history absensi
  const {
    dataHistory,
    isLoadingHistory,
    isErrorHistory,
    errorHistory,
    refetchHistory,
  } = useAbsenGuru({
    guruId,
    month: selectedMonthYYYYMM,
    enableQuery: !!guruId && !!month,
  });

  // Cari nama guru dari data cache useUser
  const guruName = useMemo(() => {
    return dataGuru?.find((g) => g.id === guruId)?.name ?? "Guru";
  }, [dataGuru, guruId]);

  // 3. Hitung total absensi (HANYA YANG HADIR) dan gaji
  const { totalAbsen, totalGaji } = useMemo(() => {
    if (!dataHistory) return { totalAbsen: 0, totalGaji: 0 };

    const totalAbsen = dataHistory.filter(
      (absen) => absen.status === StatusAbsenGuru.HADIR,
    ).length;

    const totalGaji = totalAbsen * GAJI_PER_SESI;
    return { totalAbsen, totalGaji };
  }, [dataHistory]);

  // Tampilan Loading
  if (isLoadingGuru || isLoadingHistory) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Tampilan Error
  if (isErrorHistory) {
    return (
      <AlertDialog>
        <AlertCircle className="h-4 w-4" />
        <AlertDialogTitle>Gagal Memuat Data</AlertDialogTitle>
        <AlertDialogDescription>{errorHistory?.message}</AlertDialogDescription>
      </AlertDialog>
    );
  }

  // Tampilan Utama
  return (
    <div className="space-y-4">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl">History Gaji Guru: {guruName}</h1>
          <p className="text-muted-foreground text-sm">
            Lihat history absensi terverifikasi untuk perhitungan gaji.
          </p>
        </div>

        {/* Filter Bulan */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal md:w-[240px]"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dayjs(month).format("MMMM YYYY")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single" // <-- Ganti dari "month"
              month={month}
              onMonthChange={(newMonth) => {
                setMonth(newMonth);
                setOpen(false); // Tutup popover setelah memilih
              }}
              captionLayout="dropdown" // <-- Ganti dari "dropdown-buttons"
              fromYear={2024}
              toYear={dayjs().year()}
              className="rdp-month-picker"
            />
          </PopoverContent>
        </Popover>
      </header>

      {/* Kartu Rangkuman Gaji */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rangkuman Gaji - {dayjs(month).format("MMMM YYYY")}
          </CardTitle>
          <span className="text-muted-foreground text-xs">
            Rate: {toRupiah(GAJI_PER_SESI)} / Sesi (Hadir)
          </span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Total Sesi */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Total Sesi (Hadir)
              </p>
              <Users className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold">{totalAbsen} Sesi</div>
            <p className="text-muted-foreground text-xs">
              Total sesi yang terverifikasi hadir bulan ini
            </p>
          </div>
          {/* Total Gaji */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Total Gaji
              </p>
              <span className="text-lg font-bold text-green-600">Rp</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-green-600">
              {toRupiah(totalGaji)}
            </div>
            <p className="text-muted-foreground text-xs">
              {totalAbsen} Sesi x {toRupiah(GAJI_PER_SESI)}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => refetchHistory()}
            disabled={isLoadingHistory}
          >
            Refresh Data
          </Button>
        </CardFooter>
      </Card>

      {/* Tabel History Absensi */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Absensi</CardTitle>
          <CardDescription>
            Daftar absensi terverifikasi yang masuk dalam perhitungan gaji bulan{" "}
            {dayjs(month).format("MMMM YYYY")}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={dataHistory ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
