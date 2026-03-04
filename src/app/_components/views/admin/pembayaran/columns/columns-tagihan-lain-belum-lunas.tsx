"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { RouterOutputs } from "@/trpc/react";
import { formatDateWITA } from "@/utils/dateUtils";
import { formatWhatsAppReminder } from "@/utils/noWAUtils";
import { toRupiah } from "@/utils/toRupiah";

// Derive type from the specific query to be safe
type TypeTagihanLainBelumLunas =
	RouterOutputs["tagihanLain"]["getAllBelumLunas"][number];

interface ColumnsTagihanLainBelumLunasConfig {
	onVerifyClick: (item: TypeTagihanLainBelumLunas) => void;
}

export const columnsTagihanLainBelumLunas = ({
	onVerifyClick,
}: ColumnsTagihanLainBelumLunasConfig): ColumnDef<TypeTagihanLainBelumLunas>[] => [
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
		header: "No",
		cell: ({ row }) => row.index + 1,
	},
	// Nama Murid & Kelas
	{
		id: "namaMurid",
		accessorFn: (row) => row.murid.namaLengkap,
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="pl-0 hover:bg-transparent"
			>
				Siswa & Kelas
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="text-sm font-medium">
					{row.original.murid.namaLengkap}
				</span>
				<span className="text-muted-foreground text-[10px]">
					{row.original.kelas?.kodeKelas ?? "-"}
				</span>
			</div>
		),
	},
	// Kategori & Judul
	{
		id: "keterangan",
		header: "Keterangan",
		cell: ({ row }) => (
			<div className="flex flex-col">
				<Badge variant="outline" className="mb-1 w-fit px-1 py-0 text-[10px]">
					{row.original.kategori}
				</Badge>
				<span className="text-sm font-medium line-clamp-1">
					{row.original.judul}
				</span>
				{row.original.deskripsi && (
					<span className="text-muted-foreground line-clamp-1 text-[10px]">
						{row.original.deskripsi}
					</span>
				)}
			</div>
		),
	},
	// Nominal
	{
		accessorKey: "jumlah",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="pl-0 hover:bg-transparent"
			>
				Nominal
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<div className="font-medium">{toRupiah(row.original.jumlah)}</div>
		),
	},
	// Tanggal Dibuat
	{
		accessorKey: "createdAt",
		header: "Tanggal",
		cell: ({ row }) => (
			<span className="text-xs text-muted-foreground">
				{formatDateWITA(row.original.createdAt)}
			</span>
		),
	},
	// Aksi
	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const noWA = row.original.murid.noWA;
			const namaMurid = row.original.murid.namaLengkap;
			const tipe = `Tagihan ${row.original.kategori}: ${row.original.judul}`;
			const jumlah = row.original.jumlah;
			const noRekening = row.original.murid.cabang?.noRekening;
			const bank = row.original.murid.cabang?.bank;
			const atasNama = row.original.murid.cabang?.atasNama;

			return (
				<div className="flex items-center gap-2">
					<Button
						asChild
						variant="outline"
						size="sm"
						className="h-8 gap-2 border-green-200 text-green-600 hover:bg-green-50"
						title="Kirim Pengingat WA"
					>
						<Link
							href={formatWhatsAppReminder(
								noWA,
								namaMurid,
								tipe,
								jumlah,
								null,
								noRekening,
								bank,
								atasNama,
							)}
							target="_blank"
						>
							<MessageCircle className="h-4 w-4" />
							<span className="hidden xl:inline">Ingatkan</span>
						</Link>
					</Button>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="default"
								size="sm"
								title="Verifikasi Lunas"
								className="h-8 gap-2"
							>
								<CheckCircle className="h-4 w-4" />
								<span className="hidden xl:inline">Lunas</span>
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
								<AlertDialogDescription>
									Apakah anda yakin ingin menandai tagihan ini sebagai LUNAS?
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction onClick={() => onVerifyClick(row.original)}>
									Ya, Lunas
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			);
		},
	},
];
