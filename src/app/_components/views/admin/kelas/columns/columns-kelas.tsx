"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit2, EllipsisVertical, Trash, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { TypeKelas } from "@/types/kelas.type";
import Link from "next/link";

interface ColumnsConfig {
  onEditKelasClick: (item: TypeKelas) => void;
  onEditGuruKelasClick: (item: TypeKelas) => void;
  onDeleteClick: (programKelasId: string, programKelasName: string) => void;
  onUpLevelClick: (item: TypeKelas) => void;
}

export const columns = ({
  onEditKelasClick,
  onEditGuruKelasClick,
  onDeleteClick,
  onUpLevelClick,
}: ColumnsConfig): ColumnDef<TypeKelas>[] => [
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
    header: "Nama Program Kelas",
    cell: ({ row }) => (
      <Link href={`/admin/kelas/detail/${row.original.id}`}>
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

  // {
  //   accessorKey: "level",
  //   header: "Level",
  //   cell: ({ row }) => (
  //     <div
  //       className="max-w-[300px] truncate"
  //       title={row.original.level.toString()}
  //     >
  //       {row.original.level}
  //     </div>
  //   ),
  // },

  // {
  //   accessorKey: "tipe",
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Tipe
  //         <ArrowUpDown className="ml-2 h-4 w-4" />
  //       </Button>
  //     );
  //   },
  // },

  // {
  //   accessorKey: "grup",
  //   header: ({ column }) => {
  //     return (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Grup
  //         <ArrowUpDown className="ml-2 h-4 w-4" />
  //       </Button>
  //     );
  //   },
  // },

  {
    accessorKey: "bulanTahunAjar",
    header: "Tahun Ajar",
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate"
        title={row.original.bulanTahunAjar}
      >
        {row.original.bulanTahunAjar}
      </div>
    ),
  },

  {
    accessorKey: "deskripsi",
    enableHiding: true,
    header: "Deskripsi",
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate"
        title={row.original.deskripsi ?? "-"}
      >
        {row.original.deskripsi ?? "-"}
      </div>
    ),
  },

  {
    accessorKey: "hargaKelas",
    header: "Harga Kelas Per Sesi",
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate"
        title={row.original.hargaKelas.toString()}
      >
        {row.original.hargaKelas}
      </div>
    ),
  },

  {
    accessorKey: "guruKelas",
    header: "Guru Kelas",
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate"
        title={row.original.historyGuruKelases[0]?.guru.name ?? "-"}
      >
        {row.original.historyGuruKelases[0]?.guru.name ?? "-"}
      </div>
    ),
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
            <DropdownMenuItem onClick={() => onEditKelasClick(row.original)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Kelas
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEditGuruKelasClick(row.original)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Guru Kelas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUpLevelClick(row.original)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Naik Kelas (Up Level)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                onDeleteClick(row.original.id, row.original.kodeKelas)
              }
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
