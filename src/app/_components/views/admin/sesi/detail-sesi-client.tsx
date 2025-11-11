"use client";

import { useParams } from "next/navigation";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatToWITA } from "@/utils/dateUtils";
import { StatusAbsenMurid } from "@prisma/client";
import { AlertCircle, FileText } from "lucide-react";

/**
 * Helper untuk mendapatkan teks dan varian badge berdasarkan status absensi
 */
function getBadgeContent(status: StatusAbsenMurid | null): {
  text: string;
  variant: "default" | "destructive" | "secondary" | "outline";
} {
  switch (status) {
    case StatusAbsenMurid.HADIR:
      return { text: "H", variant: "default" }; // Hijau
    case StatusAbsenMurid.ALPA:
      return { text: "A", variant: "destructive" }; // Merah
    case StatusAbsenMurid.OFF_SEMENTARA:
      return { text: "Off", variant: "secondary" }; // Abu-abu
    default:
      return { text: "-", variant: "outline" }; // Kosong
  }
}

export default function DetailSesiClient() {
  const { kelasId } = useParams<{ kelasId: string }>();

  // 1. Ambil data summary menggunakan hook
  const { dataSummary, isLoadingSummary, isErrorSummary, errorSummary } =
    useSesiPertemuan({
      kelasId: kelasId,
    });

  // 2. Loading State
  if (isLoadingSummary) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // 3. Error State
  if (isErrorSummary) {
    return (
      <AlertDialog>
        <AlertCircle className="h-4 w-4" />
        <AlertDialogTitle>Gagal Memuat Data</AlertDialogTitle>
        <AlertDialogDescription>{errorSummary?.message}</AlertDialogDescription>
      </AlertDialog>
    );
  }

  // 4. Empty State (Data ada tapi tidak ada sesi)
  if (!dataSummary || dataSummary.columnData.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-10">
        <FileText className="text-muted-foreground h-16 w-16" />
        <CardTitle className="mt-4">Belum Ada Sesi</CardTitle>
        <CardDescription className="mt-2 text-center">
          Belum ada sesi pertemuan yang tercatat untuk kelas ini.
        </CardDescription>
      </Card>
    );
  }

  const { kelasInfo, columnData, rowData } = dataSummary;

  // 5. Success State (Render Tabel)
  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardHeader>
          <CardTitle>Detail Sesi: {kelasInfo.kodeKelas}</CardTitle>
          <CardDescription>
            Guru Aktif Saat Ini:{" "}
            <span className="text-foreground font-medium">
              {kelasInfo.guruAktif}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-max">
              <TableHeader>
                {/* --- Baris Header 1: Tanggal --- */}
                <TableRow>
                  <TableHead
                    rowSpan={3}
                    className="bg-muted sticky left-0 min-w-40 border-r align-middle"
                  >
                    Nama Siswa
                  </TableHead>
                  {columnData.map((col) => (
                    <TableHead key={col.sesiId} className="p-0 text-center">
                      <Tooltip>
                        <TooltipTrigger className="w-full px-2 py-2.5">
                          tgl {formatToWITA(col.tanggal, "dddd/DD/MM")}
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatToWITA(
                            col.tanggal,
                            "dddd, D MMMM YYYY, HH:mm",
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                </TableRow>

                {/* --- Baris Header 2: Pertemuan Ke --- */}
                <TableRow>
                  {columnData.map((col) => (
                    <TableHead key={col.sesiId} className="text-center">
                      {col.pertemuanKe}
                    </TableHead>
                  ))}
                </TableRow>

                {/* --- Baris Header 3: Pengajar --- */}
                <TableRow>
                  {columnData.map((col) => (
                    <TableHead key={col.sesiId} className="text-center">
                      Pengajar {col.pengajar}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowData.map((row) => (
                  <TableRow key={row.studentId}>
                    {/* Kolom Nama Siswa (Sticky) */}
                    <TableCell className="bg-background sticky left-0 border-r font-medium">
                      {row.namaSiswa}
                    </TableCell>

                    {/* Kolom Absensi (Dinamis) */}
                    {columnData.map((col) => {
                      const status = row.attendance[col.sesiId];
                      const { text, variant } = getBadgeContent(status ?? null);
                      return (
                        <TableCell key={col.sesiId} className="text-center">
                          <Badge variant={variant}>{text}</Badge>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
