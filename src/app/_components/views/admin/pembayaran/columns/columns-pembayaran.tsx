"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle,
  Edit2,
  Trash,
  EllipsisVertical,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { RouterOutputs } from "@/trpc/react";
import { StatusPembayaran } from "@prisma/client";
import { formatDateWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";
import Link from "next/link";

// Kita gunakan tipe data dari router getAll yang baru
type PembayaranData = RouterOutputs["pembayaran"]["getAll"][number];

interface ColumnsConfig {
  onEditClick: (item: PembayaranData) => void;
  onDeleteClick: (item: PembayaranData) => void;
  onVerifyClick: (item: PembayaranData) => void;
}

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

// Helper untuk format No. WA
const formatWhatsAppLink = (noWA: string) => {
  if (!noWA) return "#";
  let formatted = noWA.trim();
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substring(1);
  } else if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }
  return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}`;
};

export const columns = ({
  onEditClick,
  onDeleteClick,
  onVerifyClick,
}: ColumnsConfig): ColumnDef<PembayaranData>[] => [
  // Checkbox selection
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Nama Murid
  {
    accessorFn: (row) => row.pendaftaranKelas.murid.namaLengkap,
    id: "namaMurid",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nama Murid
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/admin/pembayaran/${row.original.pendaftaranKelas.muridId}`}>
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.pendaftaranKelas.murid.namaLengkap}
          </span>
          <span className="text-muted-foreground text-xs">
            {row.original.pendaftaranKelas.Kelas.kodeKelas}
          </span>
        </div>
      </Link>
    ),
  },

  // Pembayaran Ke
  {
    accessorKey: "pembayaranKe",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Ke-
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.pembayaranKe}</div>
    ),
  },

  // Jumlah Bayar
  {
    accessorKey: "jumlahBayar",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nominal
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="min-w-[100px] font-medium">
        {toRupiah(row.original.jumlahBayar)}
      </div>
    ),
  },

  // Tanggal Jatuh Tempo & Bayar
  {
    id: "tanggal",
    header: "Jatuh Tempo / Bayar",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-16 text-xs">Tempo:</span>
          <span>{formatDateWITA(row.original.tanggalJatuhTempo)}</span>
        </div>
        {row.original.tanggalBayar ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 text-xs">Bayar:</span>
            <span className="font-medium text-green-600">
              {formatDateWITA(row.original.tanggalBayar)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 text-xs">Bayar:</span>
            <span className="text-muted-foreground italic">-</span>
          </div>
        )}
      </div>
    ),
  },

  // Status Pembayaran
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
          {row.original.verifiedBy && (
            <span className="text-muted-foreground text-[10px]">
              Verif: {row.original.verifiedBy.name}
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
        className="text-muted-foreground max-w-[150px] truncate text-sm"
        title={row.original.note ?? ""}
      >
        {row.original.note ?? "-"}
      </div>
    ),
  },

  // Aksi (WA & Menu)
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const noWA = row.original.pendaftaranKelas.murid.noWA;
      const isLunas = row.original.statusBayar === StatusPembayaran.LUNAS;

      return (
        <div className="flex items-center gap-2">
          {/* Tombol WA Cepat */}
          <Button
            asChild
            variant="outline"
            size="icon-sm"
            className="h-8 w-8 border-green-200 text-green-600 hover:bg-green-50"
            title="Hubungi via WhatsApp"
          >
            <Link href={formatWhatsAppLink(noWA)} target="_blank">
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <EllipsisVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Aksi Cepat Verifikasi */}
              {!isLunas && (
                <DropdownMenuItem onClick={() => onVerifyClick(row.original)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Tandai Lunas
                </DropdownMenuItem>
              )}
              {isLunas && (
                <DropdownMenuItem onClick={() => onVerifyClick(row.original)}>
                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                  Batalkan Lunas
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => onEditClick(row.original)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Detail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteClick(row.original)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Hapus Tagihan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
