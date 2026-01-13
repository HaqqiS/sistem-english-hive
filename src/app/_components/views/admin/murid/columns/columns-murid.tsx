"use client";

import { StatusMurid } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import {
	Album,
	ArrowUpDown,
	Copy,
	EllipsisVertical,
	Instagram,
	MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TypeAllMurid } from "@/types/murid.type";
import { formatDateWITA } from "@/utils/dateUtils";
import { formatWhatsAppLink } from "@/utils/noWAUtils";

interface ColumnsConfig {
	onEditClick: (item: TypeAllMurid) => void;
	onEditStatusClick: (item: TypeAllMurid) => void;
	onDeleteClick: (id: string, namaLengkap: string) => void;
}

export const getStatusColorBadge = (status: StatusMurid): string => {
	switch (status) {
		// --- STATUS UTAMA (Variable Global) ---
		case StatusMurid.AKTIF:
			return "bg-accent hover:bg-accent/90 text-accent-foreground text-white";

		case StatusMurid.NON_AKTIF:
			return "bg-stone-500 hover:bg-stone-600 text-white";

		case StatusMurid.PENDAFTAR_BARU:
			return "bg-destructive hover:bg-destructive/90 text-destructive-foreground text-white";

		case StatusMurid.LULUS:
			return "bg-purple-600 hover:bg-purple-700 text-white";

		case StatusMurid.TRIAL:
			return "bg-sky-500 hover:bg-sky-600 text-white";

		case StatusMurid.PENDING:
			return "bg-orange-500 hover:bg-orange-600 text-white";

		case StatusMurid.PLACEMENT_TEST:
			return "bg-pink-500 hover:bg-pink-600 text-white";
		case StatusMurid.ON_GOING:
			return "bg-fuchsia-500 hover:bg-fuchsia-600 text-white";
		case StatusMurid.WAITING_LIST:
			return "bg-yellow-500 hover:bg-yellow-600 text-white";
		case StatusMurid.TUNGGU_KONFIRMASI:
			return "bg-lime-500 hover:bg-lime-600 text-white";
		default:
			return "bg-gray-500 text-white";
	}
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

	{
		id: "nomer",
		accessorKey: "nomer",
		header: "Nomer",
		cell: ({ row }) => row.index + 1,
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
				Nama & Kelas
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
					{row.original.pendaftaranKelases.length > 0
						? row.original.pendaftaranKelases[0]?.Kelas.kodeKelas
						: "-"}{" "}
					|{" "}
					{row.original.pendaftaranKelases.length > 0
						? row.original.pendaftaranKelases[0]?.Kelas.historyGuruKelases[0]
								?.guru.name
						: "-"}
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
				{/* Instagram Info */}
				{row.original.instagram && (
					<Link
						href={`https://instagram.com/${row.original.instagram.replace("@", "")}`}
						target="_blank"
						className="flex items-center gap-1.5 font-medium hover:underline"
					>
						<Instagram className="h-3 w-3" />
						{row.original.instagram}
					</Link>
				)}
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
					// title={row.original.jamPulang}
				>
					{/* Plg: {row.original.jamPulang} */}
				</span>
				{/* <span>
          {row.original.deskripsi && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-help items-center gap-1 rounded border border-yellow-200 bg-yellow-50 px-1.5 py-0.5 text-[10px] text-yellow-700">
                    <StickyNote className="h-3 w-3" />
                    <span className="font-medium">Note</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="border-yellow-200 bg-yellow-50 text-yellow-900">
                  <p className="max-w-xs text-xs font-medium">Catatan:</p>
                  <p className="max-w-xs text-xs">{row.original.deskripsi}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span> */}
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
				<Badge className={`${getStatusColorBadge(status)} capitalize`}>
					{status.replaceAll("_", " ").toLowerCase()}
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

	// 8. Catatan
	{
		accessorKey: "deskripsi",
		header: "Catatan",
		cell: ({ row }) => (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="text-muted-foreground flex cursor-help items-center gap-1 text-xs">
							<Album className="h-3 w-3 shrink-0" />
							<span className="max-w-[120px] truncate">
								{row.original.deskripsi}
							</span>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p className="max-w-xs text-xs font-medium">Catatan:</p>
						<p className="max-w-xs text-xs">{row.original.deskripsi}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		),
	},

	// 9. Tanggal Dibuat
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="pl-0 hover:bg-transparent"
			>
				Dibuat
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const formattedDate = formatDateWITA(row.original.createdAt);
			return <span className="text-sm">{formattedDate}</span>;
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
