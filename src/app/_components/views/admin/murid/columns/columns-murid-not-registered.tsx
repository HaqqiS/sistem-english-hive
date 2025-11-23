"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Copy,
  EllipsisVertical,
  MessageCircle,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TypeMuridNotRegistered } from "@/types/murid.type";
import { toast } from "sonner";
import Link from "next/link";

interface ColumnsConfig {
  onEditStatusClick: (item: TypeMuridNotRegistered) => void;
  onDeleteClick: (pendaftaranId: string) => void;
}

// Helper untuk format link WA
const formatWhatsAppLink = (noWA: string) => {
  let formatted = noWA.trim();
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substring(1);
  } else if (formatted.startsWith("+62")) {
    formatted = formatted.substring(1);
  }
  return `https://wa.me/${formatted}`;
};

export const columns = ({
  onEditStatusClick,
  // onDeleteClick,
}: ColumnsConfig): ColumnDef<TypeMuridNotRegistered>[] => [
  // 1. Checkbox
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

  // 2. Identitas Murid (Nama, Umur, Kelas Sekolah)
  // Menggabungkan info ini agar admin langsung kenal siapa muridnya
  {
    accessorKey: "namaLengkap",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="pl-0"
      >
        Identitas Murid
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Button
          variant="link"
          className="text-foreground h-auto w-fit justify-start px-0 py-0 text-left font-medium"
          onClick={() => onEditStatusClick(row.original)}
        >
          {row.original.namaLengkap}
        </Button>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <School className="h-3 w-3" />
            Kelas {row.original.kelasSekolah}
          </span>
          <span>•</span>
          <span>{row.original.umur} Tahun</span>
        </div>
      </div>
    ),
    enableHiding: false,
  },

  // 3. Kontak (WhatsApp)
  // Dibuat interaktif agar bisa langsung chat/copy
  {
    accessorKey: "noWA",
    header: "Kontak",
    cell: ({ row }) => {
      const noWA = row.original.noWA;
      return (
        <div className="flex items-center gap-2">
          <Link
            href={formatWhatsAppLink(noWA)}
            target="_blank"
            className="flex items-center gap-1 font-medium text-green-600 hover:underline"
            title="Chat WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </Link>
          <span className="text-sm text-green-600">{noWA}</span>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(noWA);
              toast.success("Nomor WA disalin");
            }}
            className="text-muted-foreground hover:text-foreground ml-1"
            title="Copy Nomor"
          >
            <Copy
              className="text-muted-foreground hover:text-foreground h-3 w-3 cursor-pointer"
              onClick={async () => {
                await navigator.clipboard.writeText(row.original.noWA);
                toast.success("Nomor WA disalin");
              }}
            />
          </button>
        </div>
      );
    },
  },

  // 4. Preferensi (Program & Jam Pulang)
  {
    accessorKey: "pilihanProgram",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Minat Program & Waktu
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex max-w-[250px] flex-col gap-1 text-sm">
          <span
            className="truncate font-medium"
            title={row.original.pilihanProgram ?? "-"}
          >
            {row.original.pilihanProgram ?? "Belum memilih"}
          </span>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help truncate text-xs">
                  Plg: {row.original.jamPulang}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Jam Pulang Sekolah: {row.original.jamPulang}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },

  // 5. Status
  {
    accessorKey: "statusMurid",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.statusMurid;
      // Mapping warna badge berdasarkan status (opsional, sesuaikan dengan enum Anda)
      const variant = status === "AKTIF" ? "default" : "destructive";

      return (
        <Badge variant={variant} className="capitalize">
          {status.toLowerCase().replace("_", " ")}
        </Badge>
      );
    },
  },

  // 6. Actions
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
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEditStatusClick(row.original)}>
              Edit Status / Detail
            </DropdownMenuItem>
            {/* Uncomment jika ingin mengaktifkan delete
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteClick(row.original.id)}
            >
              Hapus Data
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
