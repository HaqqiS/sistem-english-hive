// src/app/admin/cabang/columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CabangType } from "@/types/cabang.type";

interface ColumnsConfig {
	onEditClick: (item: CabangType) => void;
	onDeleteClick: (cabangId: string, cabangName: string) => void;
}

export const columns = ({
	onEditClick,
	onDeleteClick,
}: ColumnsConfig): ColumnDef<CabangType>[] => [
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

	// Nama Cabang (clickable)
	{
		accessorFn: (row) => row.namaCabang,
		header: "Nama Cabang",
		cell: ({ row }) => (
			<Button
				variant="link"
				className="text-foreground w-fit px-0 text-left text-base"
				onClick={() => onEditClick(row.original)}
			>
				{row.original.namaCabang}
			</Button>
		),
		enableHiding: false,
	},

	// Alamat
	{
		accessorKey: "alamat",
		header: "Alamat",
		cell: ({ row }) => (
			<div className="max-w-[300px] truncate" title={row.original.alamat}>
				{row.original.alamat}
			</div>
		),
	},

	// No Telepon (sortable)
	{
		accessorKey: "noTelp",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					No Telepon
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},

	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => (
			<div className="max-w-[300px] truncate" title={row.original.email ?? ""}>
				{row.original.email}
			</div>
		),
	},

	{
		accessorKey: "noRekening",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					No Rekening
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const value = row.original.noRekening;
			return <div>{value ? value : "-"}</div>;
		},
	},

	{
		accessorKey: "bank",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Bank
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const value = row.original.bank;
			return <div>{value ? value : "-"}</div>;
		},
	},

	{
		accessorKey: "atasNama",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Atas Nama
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const value = row.original.atasNama;
			return <div>{value ? value : "-"}</div>;
		},
	},

	// Actions dropdown
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
								onDeleteClick(row.original.id, row.original.namaCabang)
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
