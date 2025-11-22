"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { useUser } from "@/hooks/useUser";
import { DataTable } from "@/app/_components/shared/data-table-generic";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toRupiah } from "@/utils/toRupiah";
import dayjs from "@/utils/dateUtils";
import { AlertCircle, CalendarIcon, Users, CalendarDays } from "lucide-react";
import {
  calculateTotalGaji,
  getPeriodeGaji,
  GAJI_PER_SESI,
} from "@/server/services/gaji.service";

export default function DetailGuruClient() {
  const { guruId } = useParams<{ guruId: string }>();
  const [open, setOpen] = useState(false);

  // State untuk menyimpan bulan gaji yang dipilih (misal: November 2025)
  const [month, setMonth] = useState<Date | undefined>(new Date());
  const selectedMonthYYYYMM = dayjs(month).format("YYYY-MM");

  // Helper untuk menampilkan text periode (Tgl 26 Prev - 25 Curr) di UI
  const periodeText = useMemo(() => {
    const { startDate, endDate } = getPeriodeGaji(selectedMonthYYYYMM);
    return `${dayjs(startDate).format("D MMM")} - ${dayjs(endDate).format(
      "D MMM YYYY",
    )}`;
  }, [selectedMonthYYYYMM]);

  // 1. Query untuk mendapatkan nama guru
  const { data: dataGuru, isLoading: isLoadingGuru } = useUser();

  // 2. Query history (Backend sudah handle filter tgl 26-25)
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

  const guruName = useMemo(() => {
    return dataGuru?.find((g) => g.id === guruId)?.name ?? "Guru";
  }, [dataGuru, guruId]);

  // 3. Hitung total gaji menggunakan logic yang sama dengan service (atau panggil logic service jika perlu)
  const { totalAbsen, totalGaji } = useMemo(() => {
    if (!dataHistory) return { totalAbsen: 0, totalGaji: 0 };

    // Kita bisa pakai helper dari service agar logic tetap 1 sumber
    const { totalHadir, totalGaji } = calculateTotalGaji(dataHistory);

    return { totalAbsen: totalHadir, totalGaji };
  }, [dataHistory]);

  if (isLoadingGuru || isLoadingHistory) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isErrorHistory) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Gagal Memuat Data</AlertTitle>
        <AlertDescription>{errorHistory?.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold">Gaji Guru: {guruName}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
            <CalendarDays className="h-3 w-3" />
            Periode:{" "}
            <span className="text-foreground font-medium">{periodeText}</span>
          </p>
        </div>

        {/* Filter Bulan Gaji */}
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Pilih Bulan Gaji
          </span>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal md:w-60"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dayjs(month).format("MMMM YYYY")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="end">
              <Calendar
                mode="single"
                month={month}
                onMonthChange={(newMonth) => {
                  if (newMonth) {
                    setMonth(newMonth);
                    setOpen(false);
                  }
                }}
                captionLayout="dropdown"
                startMonth={new Date(2024, 0)}
                endMonth={new Date(dayjs().year() + 1, 11)}
                classNames={{
                  month: "space-y-0 space-x-5 h-8",
                  caption: "relative flex justify-center items-center pt-1",
                  day: "hidden",
                  weekdays: "hidden",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Kartu Rangkuman Gaji */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Slip Gaji Bulan {dayjs(month).format("MMMM")}
          </CardTitle>
          <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
            Rate: {toRupiah(GAJI_PER_SESI)} / Sesi
          </span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
          {/* Total Sesi */}
          <div className="bg-background/50 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Total Kehadiran
              </p>
              <Users className="text-primary h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-bold">{totalAbsen} Sesi</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Jumlah sesi status &quot;HADIR&quot; dalam periode {periodeText}
            </p>
          </div>

          {/* Total Gaji */}
          <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-primary text-sm font-medium">
                Total Gaji Diterima
              </p>
              <span className="text-primary text-lg font-bold">Rp</span>
            </div>
            <div className="text-primary mt-2 text-2xl font-bold">
              {toRupiah(totalGaji)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {totalAbsen} Sesi x {toRupiah(GAJI_PER_SESI)}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground ml-auto text-xs"
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
          <CardTitle>Rincian Absensi</CardTitle>
          <CardDescription>
            Data detail pertemuan yang masuk dalam periode {periodeText}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={dataHistory ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
