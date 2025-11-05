"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { PendaftaranKelasType } from "@/types/pendaftaranKelas.type";
import { Badge } from "@/components/ui/badge";
import { formatDateWITA } from "@/utils/dateUtils";

interface ColumnsConfig {
  onEditClick: (item: PendaftaranKelasType) => void;
  onDeleteClick: (pendaftaranId: string) => void;
}

export const columns = ({
  onEditClick,
  onDeleteClick,
}: ColumnsConfig): ColumnDef<PendaftaranKelasType>[] => [
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
    accessorFn: (row) => row.murid.namaLengkap, // Akses data nested
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
        {row.original.murid.namaLengkap}
      </Button>
    ),
    enableHiding: false,
  },

  // Kolom Program Kelas (dari relasi)
  {
    accessorFn: (row) => row.Kelas.kodeKelas, // Akses data nested
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
    cell: ({ row }) => {
      return (
        <div
          className="max-w-[350px] truncate"
          title={row.original.Kelas.kodeKelas}
        >
          {row.original.Kelas.kodeKelas}
        </div>
      );
    },
  },

  // Kolom Tanggal Mulai
  {
    accessorKey: "tanggalMulai",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tanggal Mulai
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      // Format tanggal ke format Indonesia

      return (
        <div className="min-w-[120px]">
          {formatDateWITA(row.original.tanggalMulai)}
        </div>
      );
    },
  },

  // Kolom Status (Aktif/Non-Aktif)
  {
    accessorKey: "isAktif",
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
      const isActive = row.original.isAktif;
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Aktif" : "Non-Aktif"}
        </Badge>
      );
    },
    filterFn: (row, id, value: unknown) => {
      const cell = row.getValue(id);
      if (Array.isArray(value)) {
        const stringValues = value.map((v) => String(v));
        return stringValues.includes(String(cell));
      }
      return String(cell) === String(value);
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
