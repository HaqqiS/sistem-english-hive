"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TypePembayaranJatuhTempo } from "@/types/pembayaran.type";
import { formatDateWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StatusPembayaran } from "@prisma/client";

interface ColumnsJatuhTempoConfig {
  onVerifyClick: (item: TypePembayaranJatuhTempo) => void;
}

// Helper untuk membuat Link WA dengan Template Pesan
const formatWhatsAppReminder = (
  noWA: string,
  namaMurid: string,
  jatuhTempo: Date,
  jumlah: number,
) => {
  if (!noWA) return "#";

  // Format nomor HP
  let formatted = noWA.trim();
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substring(1);
  } else if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }

  // Template Pesan
  const text = `Halo Kak/Bapak/Ibu, kami dari *English Hive*.\n\nKami ingin mengingatkan tagihan kursus untuk:\nNama: *${namaMurid}*\nNominal: *${toRupiah(jumlah)}*\nJatuh Tempo: *${formatDateWITA(jatuhTempo)}*\n\nMohon segera melakukan pembayaran. Terima kasih 🙏`;

  const encodedText = encodeURIComponent(text);

  return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}?text=${encodedText}`;
};

const getStatusBadgeVariant = (
  status: StatusPembayaran,
): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case StatusPembayaran.LUNAS:
      return "default"; // Hijau
    case StatusPembayaran.BELUM_LUNAS:
      return "destructive"; // Merah
    case StatusPembayaran.PENDING:
      return "secondary"; // Abu-abu
    default:
      return "outline";
  }
};

export const columnsJatuhTempo = ({
  onVerifyClick,
}: ColumnsJatuhTempoConfig): ColumnDef<TypePembayaranJatuhTempo>[] => [
  // Nama Murid & Kelas
  {
    accessorFn: (row) => row.pendaftaranKelas.murid.namaLengkap,
    id: "namaMurid",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="pl-0 hover:bg-transparent"
      >
        Siswa & Kelas
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {row.original.pendaftaranKelas.murid.namaLengkap}
        </span>
        <Badge
          variant="outline"
          className="mt-1 h-5 w-fit px-1 py-0 text-[10px]"
        >
          {row.original.pendaftaranKelas.Kelas.kodeKelas}
        </Badge>
      </div>
    ),
  },

  // Info Tagihan (Ke & Nominal)
  {
    id: "infoTagihan",
    header: "Tagihan",
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span className="text-muted-foreground text-xs">
          Bulan Ke-{row.original.pembayaranKe}
        </span>
        <span className="text-foreground font-medium">
          {toRupiah(row.original.jumlahBayar)}
        </span>
      </div>
    ),
  },

  // Jatuh Tempo
  {
    accessorKey: "tanggalJatuhTempo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="pl-0 hover:bg-transparent"
      >
        Jatuh Tempo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.tanggalJatuhTempo;
      const today = new Date();
      // Cek jika sudah lewat hari ini (tanpa jam)
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const isOverdue = targetDate < today;
      const isToday = targetDate.getTime() === today.getTime();

      return (
        <div
          className={`text-sm ${isOverdue ? "font-bold text-red-600" : isToday ? "font-medium text-orange-600" : ""}`}
        >
          {formatDateWITA(date)}
          {isToday && (
            <span className="ml-2 rounded bg-orange-100 px-1 text-[10px] text-orange-700">
              Hari Ini
            </span>
          )}
          {isOverdue && (
            <span className="ml-2 rounded bg-red-100 px-1 text-[10px] text-red-700">
              Telat
            </span>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "statusBayar",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.statusBayar;
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
          {row.original.verifiedById && (
            <span className="text-muted-foreground text-[10px]">
              Verif: {row.original.verifiedById}
            </span>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const cellValue = String(row.getValue(id) ?? "");
      const values = Array.isArray(value) ? value.map(String) : [String(value)];
      return values.includes(cellValue);
    },
  },

  // Catatan
  {
    accessorKey: "note",
    header: "Catatan",
    cell: ({ row }) => (
      <div
        className="text-muted-foreground wrap-break-words line-clamp-2 max-w-[200px] text-xs whitespace-normal"
        title={row.original.note ?? ""}
      >
        {row.original.note ?? "-"}
      </div>
    ),
  },

  // Aksi (WA Reminder & Quick Verify)
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const noWA = row.original.pendaftaranKelas.murid.noWA;
      const namaMurid = row.original.pendaftaranKelas.murid.namaLengkap;
      const jatuhTempo = row.original.tanggalJatuhTempo;
      const jumlah = row.original.jumlahBayar;

      return (
        <div className="flex items-center gap-2">
          {/* Tombol WA Reminder */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-green-200 text-green-600 hover:bg-green-50"
            title="Kirim Pengingat WA"
          >
            <Link
              href={formatWhatsAppReminder(noWA, namaMurid, jatuhTempo, jumlah)}
              target="_blank"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden xl:inline">Ingatkan</span>
            </Link>
          </Button>

          {/* Tombol Quick Verify (Check) */}
          <Button
            variant="default"
            size="sm"
            onClick={() => onVerifyClick(row.original)}
            title="Verifikasi Lunas"
            className="h-8 gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden xl:inline">Lunas</span>
          </Button>
        </div>
      );
    },
  },
];
