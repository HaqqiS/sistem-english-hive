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
import { Badge } from "@/components/ui/badge";
import type { TypeMuridNotRegistered } from "@/types/murid.type";

interface ColumnsConfig {
  onEditStatusClick: (item: TypeMuridNotRegistered) => void;
  onDeleteClick: (pendaftaranId: string) => void;
}

export const columns = ({
  onEditStatusClick,
  onDeleteClick,
}: ColumnsConfig): ColumnDef<TypeMuridNotRegistered>[] => [
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
    accessorFn: (row) => row.namaLengkap,
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
        onClick={() => onEditStatusClick(row.original)}
      >
        {row.original.namaLengkap}
      </Button>
    ),
    enableHiding: false,
  },

  // Kolom Program Kelas
  {
    accessorFn: (row) => row.pilihanProgram,
    id: "programKelas",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Pilihan Program
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div
          className="max-w-[200px] truncate"
          title={row.original.pilihanProgram ?? ""}
        >
          {row.original.pilihanProgram}
        </div>
      );
    },
  },

  {
    accessorKey: "jamPulang",
    header: "Jam Pulang",
    id: "jamPulang",
    cell: ({ row }) => (
      <div className="w-32 truncate text-sm" title={row.original.jamPulang}>
        {row.original.jamPulang}
      </div>
    ),
  },

  {
    accessorKey: "noWA",
    header: "No WA",
    cell: ({ row }) => {
      return <div className="min-w-[100px] text-sm">{row.original.noWA}</div>;
    },
  },

  {
    accessorKey: "statusMurid",
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
      const status = row.original.statusMurid;
      return (
        <Badge variant={status === "AKTIF" ? "default" : "destructive"}>
          {status}
        </Badge>
      );
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
            <DropdownMenuItem onClick={() => onEditStatusClick(row.original)}>
              Edit Status
            </DropdownMenuItem>
            {/* <DropdownMenuSeparator />
            <DropdownMenuItem
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
