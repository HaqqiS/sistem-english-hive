"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, EllipsisVertical, MessageCircle } from "lucide-react";
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
import type { TypePembayaranJatuhTempo } from "@/types/pembayaran.type";
import { StatusPembayaran } from "@prisma/client";
import { formatDateWITA } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";
import Link from "next/link";

interface ColumnsConfig {
  onEditClick: (item: TypePembayaranJatuhTempo) => void;
  onDeleteClick: (pembayaranId: string) => void;
}

// Helper untuk styling badge status
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
}: ColumnsConfig): ColumnDef<TypePembayaranJatuhTempo>[] => [
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
      <Button
        variant="link"
        className="text-foreground w-fit px-0 text-left text-base"
        onClick={() => onEditClick(row.original)}
      >
        {row.original.pendaftaranKelas.murid.namaLengkap}
      </Button>
    ),
    enableHiding: false,
  },

  // Program Kelas
  {
    accessorFn: (row) => row.pendaftaranKelas.Kelas.kodeKelas,
    id: "programKelas",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Program Kelas
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">
        {row.original.pendaftaranKelas.Kelas.kodeKelas}
      </div>
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
        Bulan Ke-
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.original.pembayaranKe}</div>
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
        Jumlah
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="min-w-[120px] font-medium">
        {toRupiah(row.original.jumlahBayar)}
      </div>
    ),
  },

  // Tanggal Jatuh Tempo
  {
    accessorKey: "tanggalJatuhTempo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Jatuh Tempo
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="min-w-[150px]">
        {formatDateWITA(row.original.tanggalJatuhTempo)}
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
      return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      // Normalize both the filter value(s) and the cell value to strings,
      // and ensure .includes is called on a proper string array to avoid any `any` issues.
      const cellValue = String(row.getValue(id) ?? "");
      const values = Array.isArray(value) ? value.map(String) : [String(value)];
      return values.includes(cellValue);
    },
  },

  // No WhatsApp
  {
    accessorFn: (row) => row.pendaftaranKelas.murid.noWA,
    id: "noWA",
    header: "No WhatsApp",
    cell: ({ row }) => {
      const noWA = row.original.pendaftaranKelas.murid.noWA;
      return (
        <div className="flex min-w-[150px] items-center gap-2">
          {noWA}
          <Button asChild variant="outline" size="icon-sm" className="h-7 w-7">
            <Link href={formatWhatsAppLink(noWA)} target="_blank">
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    },
  },

  // Aksi
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEditClick(row.original)}>
              Update Bayar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteClick(row.original.id)}
            >
              Hapus Tagihan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
