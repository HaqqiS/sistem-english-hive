"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Clock, EllipsisVertical, MapPin } from "lucide-react";
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
import type { TypeJadwalKelas } from "@/types/jadwalKelas.type";

interface ColumnsConfig {
	onEditClick: (item: TypeJadwalKelas) => void;
	onDeleteClick: (id: string, deskripsi: string) => void;
}

export const columns = ({
	onEditClick,
	onDeleteClick,
}: ColumnsConfig): ColumnDef<TypeJadwalKelas>[] => [
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

	// Hari
	{
		accessorKey: "hari",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Hari
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => (
			<Badge variant="outline" className="font-medium">
				{row.original.hari}
			</Badge>
		),
	},

	// Waktu (Logika Gabungan Tetap/Custom)
	{
		id: "waktu",
		header: "Waktu",
		cell: ({ row }) => {
			const tetap = row.original.jamSlotTetap;
			const custom = row.original.jamSlotCustom;

			// Ambil jam dari salah satu sumber
			const jamMulai = tetap?.jamMulai ?? custom?.jamMulai ?? "-";
			const jamSelesai = tetap?.jamSelesai ?? custom?.jamSelesai ?? "-";
			const isCustom = !!custom;

			return (
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-sm font-medium">
						<Clock className="text-muted-foreground h-3 w-3" />
						<span>
							{jamMulai} - {jamSelesai}
						</span>
					</div>
					{isCustom && (
						<span className="text-muted-foreground text-[10px] italic">
							(Jadwal Privat/Custom)
						</span>
					)}
					{tetap && (
						<span className="text-muted-foreground text-[10px]">
							Slot: {tetap.namaSlot}
						</span>
					)}
				</div>
			);
		},
	},

	// Kelas Info
	{
		accessorKey: "kelas.kodeKelas",
		header: "Kelas",
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium">{row.original.kelas.kodeKelas}</span>
				<span className="text-muted-foreground text-xs capitalize">
					{row.original.kelas.jenisKelas.toLowerCase().replace("_", " ")}
				</span>
			</div>
		),
	},

	// Ruangan & Cabang
	{
		accessorKey: "ruang.namaRuang",
		header: "Lokasi",
		cell: ({ row }) => (
			<div className="flex flex-col gap-0.5">
				<span className="font-medium">{row.original.ruang.namaRuang}</span>
				<div className="text-muted-foreground flex items-center gap-1 text-xs">
					<MapPin className="h-3 w-3" />
					<span>{row.original.ruang.cabang.namaCabang}</span>
				</div>
			</div>
		),
	},

	// Aksi
	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const deskripsi = `${row.original.kelas.kodeKelas} (${row.original.hari})`;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
						>
							<EllipsisVertical className="h-4 w-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuItem onClick={() => onEditClick(row.original)}>
							Edit Jadwal
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => onDeleteClick(row.original.id, deskripsi)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
