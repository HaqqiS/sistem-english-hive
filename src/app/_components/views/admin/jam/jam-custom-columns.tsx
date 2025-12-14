"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
// Ambil tipe untuk satu item, bukan seluruh array
import type { TypeJamCustom } from "@/types/jam.type";
import { Badge } from "@/components/ui/badge";

// Tipe untuk satu baris data

interface ColumnsConfig {
	onEditClick: (item: TypeJamCustom) => void;
	onDeleteClick: (jamId: string) => void;
}

export const columns = ({
	onEditClick,
	onDeleteClick,
}: ColumnsConfig): ColumnDef<TypeJamCustom>[] => [
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

	// Kolom Jam Mulai & Selesai
	{
		accessorKey: "jamMulai", // <-- Jadikan jamMulai sebagai key untuk sorting
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Waktu
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<Badge variant="outline">{row.original.jamMulai}</Badge>
				<span>-</span>
				<Badge variant="outline">{row.original.jamSelesai}</Badge>
			</div>
		),
	},

	// Actions dropdown
	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			// Buat string yang deskriptif untuk dialog konfirmasi
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
