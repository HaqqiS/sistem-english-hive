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
import { cn } from "@/lib/utils";
import type { TypePembayaranJatuhTempo } from "@/types/pembayaran.type";
import { formatDateWITA } from "@/utils/dateUtils";
import { formatWhatsAppReminder } from "@/utils/noWAUtils";
import { formatStatus, statusPembayaranColorMap } from "@/utils/statusUtils";
import { toRupiah } from "@/utils/toRupiah";

interface ColumnsJatuhTempoConfig {
	onVerifyClick: (item: TypePembayaranJatuhTempo) => void;
}

// Removed local getStatusBadgeVariant as it is now in @/utils/statusUtils

export const columnsJatuhTempo = ({
	onVerifyClick,
}: ColumnsJatuhTempoConfig): ColumnDef<TypePembayaranJatuhTempo>[] => [
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

	// Nama Murid & Kelas
	{
		accessorFn: (row) => row.pendaftaranKelas.murid.namaLengkap,
		id: "namaMurid",
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
					{row.original.pendaftaranKelas.murid.namaLengkap}
				</span>
				<Badge
					variant="outline"
					className="mt-1 h-5 w-fit px-1 py-0 text-[10px]"
				>
					{row.original.pendaftaranKelas.Kelas.kodeKelas}
				</Badge>
			</div>
		),
	},

	// Info Tagihan (Ke & Nominal)
	{
		id: "infoTagihan",
		header: "Tagihan",
		cell: ({ row }) => (
			<div className="flex flex-col text-sm">
				<span className="text-muted-foreground text-xs">
					SPP Ke-{row.original.pembayaranKe}
				</span>
				<span className="text-foreground font-medium">
					{toRupiah(row.original.jumlahBayar)}
				</span>
			</div>
		),
	},

	// Jatuh Tempo
	{
		accessorKey: "tanggalJatuhTempo",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="pl-0 hover:bg-transparent"
			>
				Jatuh Tempo
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const date = row.original.tanggalJatuhTempo;
			const today = new Date();
			// Cek jika sudah lewat hari ini (tanpa jam)
			today.setHours(0, 0, 0, 0);
			const targetDate = new Date(date);
			targetDate.setHours(0, 0, 0, 0);

			const isOverdue = targetDate < today;
			const isToday = targetDate.getTime() === today.getTime();

			return (
				<div
					className={`text-sm ${isOverdue ? "font-bold text-red-600" : isToday ? "font-medium text-orange-600" : ""}`}
				>
					{formatDateWITA(date)}
					{isToday && (
						<span className="ml-2 rounded bg-orange-100 px-1 text-[10px] text-orange-700">
							Hari Ini
						</span>
					)}
					{isOverdue && (
						<span className="ml-2 rounded bg-red-100 px-1 text-[10px] text-red-700">
							Telat
						</span>
					)}
				</div>
			);
		},
	},

	{
		accessorKey: "statusBayar",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Status
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const status = row.original.statusBayar;
			return (
				<div className="flex flex-col items-start gap-1">
					<Badge
						variant="outline"
						className={cn("font-medium", statusPembayaranColorMap[status])}
					>
						{formatStatus(status)}
					</Badge>
					{row.original.verifiedById && (
						<span className="text-muted-foreground text-[10px]">
							Verif: {row.original.verifiedById}
						</span>
					)}
				</div>
			);
		},
		filterFn: (row, id, value) => {
			const cellValue = String(row.getValue(id) ?? "");
			const values = Array.isArray(value) ? value.map(String) : [String(value)];
			return values.includes(cellValue);
		},
	},

	// Catatan
	{
		accessorKey: "note",
		header: "Catatan",
		cell: ({ row }) => (
			<div
				className="text-muted-foreground wrap-break-words line-clamp-2 max-w-[200px] text-xs whitespace-normal"
				title={row.original.note ?? ""}
			>
				{row.original.note ?? "-"}
			</div>
		),
	},

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

	// Aksi (WA Reminder & Quick Verify)
	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const noWA = row.original.pendaftaranKelas.murid.noWA;
			const namaMurid = row.original.pendaftaranKelas.murid.namaLengkap;
			const tipe = `SPP Ke-${row.original.pembayaranKe}`;
			const kelas = row.original.pendaftaranKelas.Kelas.kodeKelas;
			const jumlah = row.original.jumlahBayar;
			const jatuhTempo = row.original.tanggalJatuhTempo;
			const { noRekening, bank, atasNama } =
				row.original.pendaftaranKelas.Kelas.cabang;
			return (
				<div className="flex items-center gap-2">
					{/* Tombol WA Reminder */}
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
								kelas,
								jumlah,
								jatuhTempo,
								noRekening,
								bank,
								atasNama,
								row.original.pembayaranKe,
								row.original.pendaftaranKelas.Kelas.level,
							)}
							target="_blank"
						>
							<MessageCircle className="h-4 w-4" />
							<span className="hidden xl:inline">Ingatkan</span>
						</Link>
					</Button>

					{/* Tombol Quick Verify (Check) */}
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
									Apakah anda yakin ingin memverifikasi pembayaran ini sebagai
									Lunas?
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction onClick={() => onVerifyClick(row.original)}>
									Ya, Verifikasi
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			);
		},
	},
];
