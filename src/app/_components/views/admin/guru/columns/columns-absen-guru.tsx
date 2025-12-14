"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, EllipsisVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { TypeAbsensiGuru } from "@/types/absenGuru.type";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatToWITA } from "@/utils/dateUtils";

interface ColumnsConfig {
	onEditClick: (item: TypeAbsensiGuru) => void;
	onDeleteClick: (id: string, kodeKelasTanggalWaktu: string) => void;
	onStatusChange: (item: TypeAbsensiGuru, status: boolean) => void;
	pendingId: string | null;
}

export const columns = ({
	onEditClick,
	onDeleteClick,
	onStatusChange,
	pendingId,
}: ColumnsConfig): ColumnDef<TypeAbsensiGuru>[] => [
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
		id: "guru.name",
		accessorKey: "guru.name",
		header: "Nama Guru",
		cell: ({ row }) => (
			<Button
				variant="link"
				className="text-foreground w-fit px-0 text-left text-base"
				onClick={() => onEditClick(row.original)}
			>
				{row.original.guru.name}
			</Button>
		),
		enableHiding: false,
	},

	{
		accessorKey: "sesiPertemuanKelas.kelas.kodeKelas",
		id: "kelas",
		header: "Kelas",
		cell: ({ row }) => (
			<div
				className="max-w-[300px] truncate"
				title={row.original.sesiPertemuanKelas.kelas.kodeKelas}
			>
				{row.original.sesiPertemuanKelas.kelas.kodeKelas}
			</div>
		),
	},

	{
		accessorKey: "sesiPertemuanKelas.tanggalWaktu",
		id: "tanggal waktu",
		header: "Tanggal Waktu",
		cell: ({ row }) => (
			<div
				className="max-w-[300px] truncate"
				title={formatToWITA(row.original.sesiPertemuanKelas.tanggalWaktu)}
			>
				{formatToWITA(row.original.sesiPertemuanKelas.tanggalWaktu)}
			</div>
		),
	},

	{
		accessorKey: "isVerified",
		id: "status verifikasi",
		header: "Status Verifikasi",
		cell: ({ row }) => {
			const isVerified = row.original.isVerified;
			// Cek apakah ID baris ini sama dengan ID yang sedang diproses di parent
			const isLoading = pendingId === row.original.id;

			// 1. JIKA SUDAH TERVERIFIKASI (isVerified === true)
			if (isVerified) {
				return (
					<div className="w-[180px]">
						<Badge
							variant="outline"
							className="text-accent flex w-fit items-center gap-1 text-sm"
						>
							<Check className="h-3 w-3" />
							<span>Terverifikasi</span>
						</Badge>
					</div>
				);
			}

			// 2. JIKA BELUM TERVERIFIKASI (isVerified === false)
			return (
				<div className="w-[180px]">
					<Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
						Reviewer
					</Label>
					<Select
						// Disable input saat loading
						disabled={isLoading}
						defaultValue={"REJECTED"}
						onValueChange={(value) => {
							// Trigger perubahan status
							onStatusChange(row.original, value === "APPROVED");
						}}
					>
						<SelectTrigger
							className="w-full"
							size="sm"
							id={`${row.original.id}-reviewer`}
						>
							{/* Tampilkan Loader jika sedang loading */}
							{isLoading ? (
								<div className="text-muted-foreground flex items-center gap-2">
									<Loader2 className="h-3 w-3 animate-spin" />
									<span className="text-xs">Menyimpan...</span>
								</div>
							) : (
								<SelectValue />
							)}
						</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value={"APPROVED"}>Terverifikasi</SelectItem>
							<SelectItem value={"REJECTED"}>Tidak Terverifikasi</SelectItem>
						</SelectContent>
					</Select>
				</div>
			);
		},
	},

	{
		accessorKey: "verifiedBy.name",
		id: "diverifikasi oleh",
		header: "Diverifikasi Oleh",
		cell: ({ row }) => {
			if (!row.original.isVerified || !row.original.verifiedBy) {
				return <div>-</div>;
			}
			return <div>{row.original.verifiedBy.name}</div>;
		},
	},

	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const kodeKelasTanggalWaktu = `${row.original.sesiPertemuanKelas.kelas.kodeKelas} - ${formatToWITA(row.original.sesiPertemuanKelas.tanggalWaktu)}`;
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
								onDeleteClick(row.original.id, kodeKelasTanggalWaktu)
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
