// src/app/_components/views/admin/guru/detail/columns-guru-history.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TypeAbsensiGuruHistoryItem } from "@/types/absenGuru.type";
import { formatToWITA } from "@/utils/dateUtils";
import { Badge } from "@/components/ui/badge";
import { StatusAbsenGuru } from "@prisma/client";

// Helper untuk status badge
const getStatusBadge = (status: StatusAbsenGuru) => {
	switch (status) {
		case StatusAbsenGuru.HADIR:
			return <Badge variant="default">Hadir</Badge>;
		case StatusAbsenGuru.SAKIT:
			return <Badge variant="secondary">Sakit</Badge>;
		case StatusAbsenGuru.IJIN:
			return <Badge variant="secondary">Ijin</Badge>;
		case StatusAbsenGuru.ALPA:
			return <Badge variant="destructive">Alpa</Badge>;
		default:
			return <Badge variant="outline">{status}</Badge>;
	}
};

export const columns: ColumnDef<TypeAbsensiGuruHistoryItem>[] = [
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

	// Tanggal & Waktu Sesi
	{
		accessorFn: (row) => row.sesiPertemuanKelas.tanggalWaktu,
		id: "tanggalWaktu",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Tanggal & Waktu Sesi
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<div className="min-w-[200px]">
				{formatToWITA(
					row.original.sesiPertemuanKelas.tanggalWaktu,
					"dddd, D MMMM YYYY, HH:mm",
				)}
			</div>
		),
	},

	// Nama Kelas
	{
		accessorFn: (row) => row.sesiPertemuanKelas.kelas.kodeKelas,
		id: "kodeKelas",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Nama Kelas
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<div>{row.original.sesiPertemuanKelas.kelas.kodeKelas}</div>
		),
	},

	// Status Absensi
	{
		accessorKey: "status",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Status Absen
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => getStatusBadge(row.original.status),
	},
];
