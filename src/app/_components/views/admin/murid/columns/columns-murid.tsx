"use client";

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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TypeAllMurid } from "@/types/murid.type";
import { formatDateWITA } from "@/utils/dateUtils";
import { formatWhatsAppLink } from "@/utils/noWAUtils";
import {
	formatStatus,
	statusMuridColorMap,
	statusPendaftaranColorMap,
} from "@/utils/statusUtils";

interface ColumnsConfig {
	onEditClick: (item: TypeAllMurid) => void;
	onEditStatusClick: (item: TypeAllMurid) => void;
	onDeleteClick: (id: string, namaLengkap: string) => void;
}

// Removed local getStatusColorBadge as it is now in @/utils/statusUtils
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
		header: "No",
		cell: ({ row }) => row.index + 1,
	},

	// 1. Nama & Kelas
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
		cell: ({ row }) => {
			const sortedRegistrations = [...row.original.pendaftaranKelases].sort(
				(a, b) => {
					// 1. Prioritas Level (Desc)
					if (b.Kelas.level !== a.Kelas.level) {
						return b.Kelas.level - a.Kelas.level;
					}

					// 2. Prioritas Status (Aktif diutamakan)
					const priority: Record<string, number> = {
						AKTIF: 0,
						TRIAL: 1,
						WAITING_LIST: 2,
						NON_AKTIF: 3,
					};
					return (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
				},
			);

			return (
				<div className="flex flex-col">
					<Link href={`/admin/pembayaran/${row.original.id}`}>
						<Button
							variant="link"
							className="text-foreground h-auto w-fit justify-start px-0 py-0 text-left font-medium"
							onClick={() => onEditClick(row.original)}
						>
							{row.original.namaLengkap}
						</Button>
					</Link>
					<div className="flex items-center gap-1.5 text-xs">
						<span className="text-muted-foreground">
							{sortedRegistrations.length > 0
								? sortedRegistrations[0]?.Kelas.kodeKelas
								: "-"}{" "}
							|{" "}
							{sortedRegistrations.length > 0
								? (sortedRegistrations[0]?.Kelas.historyGuruKelases[0]?.guru
										.name ?? "Tanpa Guru")
								: "-"}
						</span>

						{sortedRegistrations.length > 1 && (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="secondary"
										className="hover:bg-accent h-5 rounded-full px-2 py-0 text-[10px] font-semibold"
									>
										+{sortedRegistrations.length - 1} lainnya
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-64 p-3" align="start">
									<div className="mb-2 border-b pb-2 text-xs font-semibold">
										Daftar Pendaftaran Kelas
									</div>
									<div className="space-y-3">
										{sortedRegistrations.map((reg, idx) => (
											<div
												key={reg.id}
												className="flex flex-col gap-1 border-border border-b pb-2 last:border-0"
											>
												<div className="flex items-center justify-between">
													<span className="font-bold text-foreground">
														{idx + 1}. {reg.Kelas.kodeKelas}
													</span>
													<Badge
														className={cn(
															"h-4 px-1.5 text-[9px] font-bold border-none",
															statusPendaftaranColorMap[reg.status],
														)}
													>
														{reg.status}
													</Badge>
												</div>
												<div className="text-muted-foreground flex items-center gap-1 pl-3 text-[10px]">
													<Album className="h-2.5 w-2.5" />
													<span>
														Guru:{" "}
														{reg.Kelas.historyGuruKelases[0]?.guru.name ??
															"Belum Set"}
													</span>
												</div>
											</div>
										))}
									</div>
								</PopoverContent>
							</Popover>
						)}
					</div>
				</div>
			);
		},
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
				<Badge
					className={cn("capitalize font-medium", statusMuridColorMap[status])}
				>
					{formatStatus(status).toLowerCase()}
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
