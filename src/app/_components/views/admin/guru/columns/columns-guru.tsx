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
import type { TypeGuruComplete } from "@/types/user.type";
import Link from "next/link";

interface ColumnsConfig {
  onEditClick: (item: TypeGuruComplete) => void;
  onDeleteClick: (id: string, namaGuru: string) => void;
  onResetPasswordClick: (id: string, namaGuru: string) => void;
}

export const columns = ({
  onEditClick,
  onDeleteClick,
  onResetPasswordClick,
}: ColumnsConfig): ColumnDef<TypeGuruComplete>[] => [
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
    id: "guru.name",
    accessorKey: "guru.name",
    header: "Nama Guru",
    cell: ({ row }) => (
      <Link href={`/admin/guru/${row.original.id}`}>
        <Button
          variant="link"
          className="text-foreground w-fit px-0 text-left text-base"
        >
          {row.original.name}
        </Button>
      </Link>
    ),
    enableHiding: false,
  },

  {
    id: "guru.email",
    accessorKey: "guru.email",
    header: "Email Guru",
    cell: ({ row }) => (
      <span className="text-foreground/80">{row.original.email}</span>
    ),
    enableHiding: false,
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
              onClick={() =>
                onResetPasswordClick(row.original.id, row.original.name ?? "")
              }
            >
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                onDeleteClick(row.original.id, row.original.name ?? "")
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
