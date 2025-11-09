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
import type { TypeKelasByGuruId } from "@/types/kelas.type";
import Link from "next/link";

interface ColumnsConfig {
  onEditClick: (item: TypeKelasByGuruId) => void;
  onDeleteClick: (programKelasId: string, programKelasName: string) => void;
}

export const columns = ({
  onEditClick,
  onDeleteClick,
}: ColumnsConfig): ColumnDef<TypeKelasByGuruId>[] => [
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
      <Link href={`/guru/absen/${row.original.id}`}>
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
    accessorKey: "tipe",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tipe
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "grup",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Grup
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  // {
  //   accessorKey: "guruKelas",
  //   header: "Guru Kelas",
  //   cell: ({ row }) => (
  //     <div
  //       className="max-w-[300px] truncate"
  //       title={row.original.historyGuruKelases[0]?.guru.name ?? "-"}
  //     >
  //       {row.original.historyGuruKelases[0]?.guru.name ?? "-"}
  //     </div>
  //   ),
  // },

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
              Edit Kelas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                onDeleteClick(row.original.id, row.original.kodeKelas)
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
