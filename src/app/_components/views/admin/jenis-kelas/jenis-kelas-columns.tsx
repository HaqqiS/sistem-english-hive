"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TypeJenisKelas } from "@/types/jenisKelas.type";
import { toRupiah } from "@/utils/toRupiah";

interface ColumnsConfig {
	onEdit: (item: TypeJenisKelas) => void;
	onDelete: (item: TypeJenisKelas) => void;
}

export const jenisKelasColumns = ({
	onEdit,
	onDelete,
}: ColumnsConfig): ColumnDef<TypeJenisKelas>[] => [
	{
		accessorKey: "nama",
		header: "Nama Program",
		cell: ({ row }) => (
			<span className="font-medium">{row.getValue("nama")}</span>
		),
	},
	{
		accessorKey: "tipe",
		header: "Tipe",
		cell: ({ row }) => <span>{row.getValue("tipe")}</span>,
	},
	{
		accessorKey: "harga (per sesi)",
		header: "Harga",
		cell: ({ row }) => <span>{toRupiah(row.getValue("harga"))}</span>,
	},
	{
		accessorKey: "deskripsi",
		header: "Deskripsi",
		cell: ({ row }) => (
			<span className="text-muted-foreground line-clamp-1 max-w-[300px] text-sm">
				{row.getValue("deskripsi") || "-"}
			</span>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const item = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<EllipsisVertical className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(item)}>
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(item)}
							className="text-destructive focus:text-destructive"
						>
							Hapus
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
