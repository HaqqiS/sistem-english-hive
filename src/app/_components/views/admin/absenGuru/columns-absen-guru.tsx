"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { TypeAbsensiGuru } from "@/types/absenGuru.type";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatToWITA } from "@/utils/dateUtils";

interface ColumnsConfig {
  onEditClick: (item: TypeAbsensiGuru) => void;
  onDeleteClick: (id: string) => void;
  onStatusChange: (item: TypeAbsensiGuru, status: boolean) => void;
  isPendingStatusChange: boolean;
}

export const columns = ({
  onEditClick,
  onDeleteClick,
  onStatusChange,
  isPendingStatusChange,
}: ColumnsConfig): ColumnDef<TypeAbsensiGuru>[] => [
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

  {
    accessorKey: "guru.name",
    header: "Nama Guru",
    cell: ({ row }) => (
      <Button
        variant="link"
        className="text-foreground w-fit px-0 text-left text-base"
        onClick={() => onEditClick(row.original)}
      >
        {row.original.guru.name}
      </Button>
    ),
    enableHiding: false,
  },

  {
    accessorKey: "kelas",
    header: "Program Kelas",
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate"
        title={row.original.sesiPertemuanKelas.kelas.kodeKelas}
      ></div>
    ),
  },

  {
    accessorKey: "jadwalSesi.tanggalWaktu",
    header: "Jadwal Sesi",
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate"
        title={formatToWITA(row.original.sesiPertemuanKelas.tanggalWaktu)}
      >
        {formatToWITA(row.original.sesiPertemuanKelas.tanggalWaktu)}
      </div>
    ),
  },

  {
    accessorKey: "isVerified",
    header: "Status Verifikasi",
    cell: ({ row }) => {
      const isVerified = row.original.isVerified;

      // 1. JIKA SUDAH TERVERIFIKASI (isVerified === true)
      // Tampilkan Badge "Terverifikasi" berwarna hijau.
      if (isVerified) {
        return (
          <div className="w-32">
            <Badge
              variant="outline"
              // Langsung gunakan class untuk status "terverifikasi"
              className="text-accent text-sm"
            >
              <Check />
              <span>Terverifikasi</span>
            </Badge>
          </div>
        );
      }

      // 2. JIKA BELUM TERVERIFIKASI (isVerified === false)
      // Tampilkan <Select> untuk mengubah status.
      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select
            // Karena isVerified === false, nilai default-nya adalah "REJECTED"
            defaultValue={"REJECTED"}
            // Asumsi Anda punya fungsi onStatusChange yang di-pass ke tabel
            onValueChange={(value) => {
              onStatusChange(row.original, value === "APPROVED" ? true : false);
            }}
          >
            <SelectTrigger
              className="w-42" // Class **:data... aneh, saya hapus
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              {/* SelectValue akan otomatis menampilkan "Belum di Verifikasi" dari defaultValue */}
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={"APPROVED"}>Terverifikasi</SelectItem>
              <SelectItem value={"REJECTED"}>Tidak Terverifikasi</SelectItem>
            </SelectContent>
          </Select>
        </>
      );
    },
  },
  {
    accessorKey: "verifiedBy.name",
    header: "Verified By",
    cell: ({ row }) => {
      if (!row.original.isVerified || !row.original.verifiedBy) {
        return <div>-</div>;
      }
      return <div>{row.original.verifiedBy.name}</div>;
    },
  },

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
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteClick(row.original.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
