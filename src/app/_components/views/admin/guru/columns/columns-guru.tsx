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
import type { TypeGuru } from "@/types/user.type";
import Link from "next/link";

interface ColumnsConfig {
  onEditClick: (item: TypeGuru) => void;
  onDeleteClick: (id: string) => void;
}

export const columns = ({
  onEditClick,
  onDeleteClick,
}: ColumnsConfig): ColumnDef<TypeGuru>[] => [
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
