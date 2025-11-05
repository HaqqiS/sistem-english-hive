"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RouterOutputs } from "@/trpc/react";
import { ArrowUpDown, EllipsisVertical } from "lucide-react";
import { formatDateWITA } from "@/utils/dateUtils";

export type DaftarMuridType =
  RouterOutputs["pendaftaranKelas"]["getPendaftarByKelasId"][number];
// export const columns: ColumnDef<z.infer<typeof schema>>[] = [
// export const columns: ColumnDef<PemasukanType>[] = [
export const columns = ({
  onEditClick,
  onDeleteClick,
}: {
  onEditClick: (item: DaftarMuridType) => void;
  onDeleteClick: (pemasukanId: string, pemasukanName: string) => void;
}): ColumnDef<DaftarMuridType>[] => [
  {
    id: "number",
    header: () =>
      // <div className="text-muted-foreground w-full text-center">No</div>
      null,

    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground text-center">{row.index + 1}</div>
      );
    },
  },
  {
    accessorKey: "murid.namaLengkap",
    header: "Nama Murid",
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
    accessorKey: "tanggalMulai",
    header: () => <div className="w-full text-center">Tanggal Masuk Kelas</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {formatDateWITA(row.original.tanggalMulai)}
      </div>
    ),
  },

  // {
  //   accessorKey: "dibuat oleh",
  //   header: "Dibuat oleh",
  //   cell: ({ row }) => {
  //     return row.original.createdBy.name;
  //   },
  // },
  // {
  //   accessorKey: "keterangan",
  //   header: "Keterangan",

  //   cell: ({ row }) => {
  //     return row.original.keterangan;
  //   },
  // },
  // {
  //   accessorKey: "dibuat pada",
  //   header: "Dibuat pada",

  //   cell: ({ row }) => {
  //     const formattedDate = dateFormatter(row.original.createdAt);
  //     return formattedDate;
  //   },
  // },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
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
              onClick={() =>
                onDeleteClick(row.original.id, row.original.murid.namaLengkap)
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
