"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Copy,
  EllipsisVertical,
  MapPin,
  MessageCircle,
} from "lucide-react";
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
import type { TypeAllMurid } from "@/types/murid.type";
import { toast } from "sonner";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ColumnsConfig {
  onEditClick: (item: TypeAllMurid) => void;
  onEditStatusClick: (item: TypeAllMurid) => void;
  onDeleteClick: (id: string, namaLengkap: string) => void;
}

// Helper untuk link WA
const formatWhatsAppLink = (noWA: string) => {
  if (!noWA) return "#";
  let formatted = noWA.trim();
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substring(1);
  } else if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }
  return `https://wa.me/${formatted.replace(/[^0-9]/g, "")}`;
};

export const columns = ({
  onEditClick,
  onEditStatusClick,
  onDeleteClick,
}: ColumnsConfig): ColumnDef<TypeAllMurid>[] => [
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

  // 1. Nama & Email
  {
    accessorKey: "namaLengkap",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="pl-0 hover:bg-transparent"
      >
        Nama & Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Button
          variant="link"
          className="text-foreground h-auto w-fit justify-start px-0 py-0 text-left font-medium"
          onClick={() => onEditClick(row.original)}
        >
          {row.original.namaLengkap}
        </Button>
        <span className="text-muted-foreground text-xs">
          {row.original.email}
        </span>
      </div>
    ),
  },

  // 2. Info Pribadi (Gender & Umur)
  {
    id: "infoPribadi",
    header: "Info Pribadi",
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span className="font-medium">
          {row.original.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
        </span>
        <span className="text-muted-foreground text-xs">
          {row.original.umur} Tahun
        </span>
      </div>
    ),
  },

  // 3. Pendidikan (Sekolah & Kelas)
  {
    id: "pendidikan",
    header: "Sekolah",
    cell: ({ row }) => (
      <div className="flex max-w-[150px] flex-col text-sm">
        <span className="truncate font-medium" title={row.original.asalSekolah}>
          {row.original.asalSekolah}
        </span>
        <span className="text-muted-foreground text-xs">
          Kelas: {row.original.kelasSekolah}
        </span>
      </div>
    ),
  },

  // 4. Kontak & Alamat
  {
    accessorKey: "noWA",
    header: "Kontak & Alamat",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2">
          <Link
            href={formatWhatsAppLink(row.original.noWA)}
            target="_blank"
            className="flex items-center gap-1 font-medium text-green-600 hover:underline"
          >
            <MessageCircle className="h-3 w-3" />
            {row.original.noWA}
          </Link>
          <Copy
            className="text-muted-foreground hover:text-foreground h-3 w-3 cursor-pointer"
            onClick={async () => {
              await navigator.clipboard.writeText(row.original.noWA);
              toast.success("Nomor WA disalin");
            }}
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-muted-foreground flex cursor-help items-center gap-1 text-xs">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="max-w-[120px] truncate">
                  {row.original.alamat}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs wrap-break-word">{row.original.alamat}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
  },

  // 5. Program & Jam Pulang
  {
    id: "programInfo",
    header: "Program Kursus",
    cell: ({ row }) => (
      <div className="flex max-w-[180px] flex-col text-sm">
        <span
          className="truncate font-medium"
          title={row.original.pilihanProgram ?? "-"}
        >
          {row.original.pilihanProgram ?? "-"}
        </span>
        <span
          className="text-muted-foreground truncate text-xs"
          title={row.original.jamPulang}
        >
          Plg: {row.original.jamPulang}
        </span>
      </div>
    ),
  },

  // 6. Sumber Info
  {
    accessorKey: "sumberInfo",
    header: "Sumber Info",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.original.sumberInfo}
      </Badge>
    ),
  },

  // 7. Status
  {
    accessorKey: "statusMurid",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="pl-0 hover:bg-transparent"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.statusMurid;
      return (
        <Badge
          variant={status === "AKTIF" ? "default" : "destructive"}
          className="capitalize"
        >
          {status.toLowerCase().replace("_", " ")}
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

  // Actions
  {
    id: "actions",
    header: "Aksi",
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
              Edit Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditStatusClick(row.original)}>
              Edit Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                onDeleteClick(row.original.id, row.original.namaLengkap)
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
