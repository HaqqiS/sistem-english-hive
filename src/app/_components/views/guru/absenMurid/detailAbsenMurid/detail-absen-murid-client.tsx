"use client";

import { useParams } from "next/navigation";
import { DataTable } from "@/app/_components/shared/data-table"; //
import { createDetailAbsenMuridColumns } from "./columns-detail-absen";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToWITA } from "@/utils/dateUtils";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAbsenMurid } from "@/hooks/useAbsenMurid";
import { useMemo } from "react";

export default function DetailAbsenMuridClient() {
  const { sesiId } = useParams<{ sesiId: string }>();

  const { data, isLoading, isError, error, mutations } = useAbsenMurid({
    sesiId,
    // Sediakan callback kustom untuk toast
    onSuccessCreateOrUpdate: (namaMurid, status) => {
      toast.success(`Absensi ${namaMurid} disimpan sebagai ${status}`);
    },
  });

  const columns = useMemo(
    () =>
      createDetailAbsenMuridColumns({
        sesiId,
        mutation: mutations.createOrUpdate,
      }),
    [sesiId, mutations.createOrUpdate],
  );

  // 3. Tampilkan loading state
  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <header>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </header>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // 4. Tampilkan error state
  if (isError) {
    return (
      <AlertDialog>
        <Terminal className="h-4 w-4" />
        <AlertDialogTitle>Error</AlertDialogTitle>
        <AlertDialogDescription>
          Gagal memuat data absensi: {error?.message}
        </AlertDialogDescription>
      </AlertDialog>
    );
  }

  // 5. Tampilkan data
  return (
    <div>
      <div className="flex items-center justify-between space-x-2 pt-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">
            Absensi Kelas: {data?.sesiInfo.kodeKelas}
          </h1>
          <p className="text-muted-foreground text-sm">
            Sesi:{" "}
            {formatToWITA(
              data?.sesiInfo.tanggalWaktu,
              "dddd, D MMMM YYYY, HH:mm", // Format lengkap
            )}
          </p>
        </header>
      </div>

      <div className="mt-4">
        {/* Menggunakan DataTable */}
        <DataTable columns={columns} data={data?.muridList ?? []} />
      </div>

      {/* <Button
        className="mt-4"
        onClick={() => toast.success("Semua absensi berhasil disimpan!")}
      >
        Simpan Absensi
      </Button> */}
    </div>
  );
}
