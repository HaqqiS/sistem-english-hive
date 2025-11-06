"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, EllipsisVertical, Router } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { SesiPertemuanWithKelasCountType } from "@/types/sesiPertemuan.type";
import { formatToWITA } from "@/utils/dateUtils";
import Link from "next/link";

interface ColumnsConfig {
  onEditClick: (item: SesiPertemuanWithKelasCountType) => void;
  // onDeleteClick: (sesiPertemuanId: string) => void;
}

export const columns = ({
  onEditClick,
  // onDeleteClick,
}: ColumnsConfig): ColumnDef<SesiPertemuanWithKelasCountType>[] => [
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
    accessorKey: "kodeKelas",
    header: "Nama Kelas",
    cell: ({ row }) => (
      <Link href={`/admin/sesi/${row.original.id}`}>
        <Button
          variant="link"
          className="text-foreground w-fit px-0 text-left text-base"
          // onClick={() => onEditClick(row.original)}
        >
          {row.original.kodeKelas}
        </Button>
      </Link>
    ),
    enableHiding: false,
  },

  {
    accessorKey: "ruang.namaRuang",
    header: "Total Sesi Pertemuan",
    cell: ({ row }) => (
      <span>{row.original._count.sesiPertemuanKelases} Pertemuan</span>
    ),
  },

  {
    accessorKey: "tanggalWaktu",
    header: "Tanggal & Waktu terakhir",

    cell: ({ row }) => {
      return formatToWITA(row.original.sesiPertemuanKelases[0]?.tanggalWaktu);
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
            {/* <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteClick(row.original.id)}
            >
              Delete
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
