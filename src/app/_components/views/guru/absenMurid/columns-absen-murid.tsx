"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BadgeCheck, Check, EllipsisVertical, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { TypeAbsensiMurid } from "@/types/absenMurid.type";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusAbsenMurid } from "@prisma/client";

const getStatusBadgeClass = (status?: StatusAbsenMurid) => {
  switch (status) {
    case StatusAbsenMurid.HADIR:
      return "border-green-200 bg-green-100 text-green-700 hover:bg-green-100";
    case StatusAbsenMurid.ALPA:
      return "border-yellow-200 bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
    case StatusAbsenMurid.OFF_SEMENTARA:
      return "border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100";
    default:
      return "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100";
  }
};

interface ColumnsConfig {
  onEditClick: (item: TypeAbsensiMurid) => void;
  onDeleteClick: (id: string) => void;
  onStatusChange: (item: TypeAbsensiMurid, status: boolean) => void;
  isPendingStatusChange: boolean;
}

export const columns = ({
  onEditClick,
  onDeleteClick,
  onStatusChange,
  isPendingStatusChange,
}: ColumnsConfig): ColumnDef<TypeAbsensiMurid>[] => [
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
    accessorKey: "status",
    header: "Status Absensi",
    cell: ({ row }) => {
      const { status } = row.original;

      return (
        <Select
          value={status} // Nilai saat ini
          disabled={isPendingStatusChange}
          onValueChange={(value) => {
            // Kirim nilai Enum baru
            // onStatusChange(row.original, value as StatusAbsen);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue asChild>
              {/* Tampilkan Badge di dalam tombol trigger */}
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 text-sm ${getStatusBadgeClass(
                  status,
                )}`}
              >
                {status === "HADIR" ? (
                  <BadgeCheck className="h-4 w-4" />
                ) : (
                  <HelpCircle className="h-4 w-4" />
                )}
                {status}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {/* Loop semua nilai dari Enum StatusAbsen */}
            {Object.values(StatusAbsenMurid).map((stat) => (
              <SelectItem key={stat} value={stat}>
                <Badge
                  variant="outline"
                  className={`px-2 text-sm ${getStatusBadgeClass(stat)}`}
                >
                  {stat}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
