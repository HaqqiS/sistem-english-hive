"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { formatDateWITA } from "@/utils/dateUtils";
import type { TypeHistoryGuruKelasByKelasId } from "@/types/historyGuruKelas.type";

export const columns = ({
  onEditClick,
  onDeleteClick,
}: {
  onEditClick: (item: TypeHistoryGuruKelasByKelasId) => void;
  onDeleteClick: (id: string, namaGuru: string) => void;
}): ColumnDef<TypeHistoryGuruKelasByKelasId>[] => [
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
    accessorKey: "",
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
    accessorKey: "mulaiPada",
    header: () => (
      <div className="w-full text-center">Tanggal Mulai Penugasan</div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        {formatDateWITA(row.original.mulaiPada)}
      </div>
    ),
  },

  {
    accessorKey: "selesaiPada",
    header: () => (
      <div className="w-full text-center">Tanggal Selesai Penugasan</div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.selesaiPada
          ? formatDateWITA(row.original.selesaiPada)
          : " Masih Bertugas "}
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
                onDeleteClick(row.original.id, row.original.guru.name ?? "")
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
