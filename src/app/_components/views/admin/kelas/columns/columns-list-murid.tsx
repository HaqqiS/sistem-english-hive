"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowUpDown,
	Copy,
	EllipsisVertical,
	MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { labelUmurTahun } from "@/lib/hitung-umur";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";
import { formatDateWITA } from "@/utils/dateUtils";
import { formatWhatsAppLink } from "@/utils/noWAUtils";
import { formatStatus, statusPendaftaranColorMap } from "@/utils/statusUtils";

export type DaftarMuridType =
	RouterOutputs["pendaftaranKelas"]["getPendaftarByKelasId"][number];
// export const columns: ColumnDef<z.infer<typeof schema>>[] = [
// export const columns: ColumnDef<PemasukanType>[] = [
export const columns = ({
	onEditClick,
	onDeleteClick,
}: {
	onEditClick: (item: DaftarMuridType) => void;
	onDeleteClick: (id: string, namaLengkap: string) => void;
}): ColumnDef<DaftarMuridType>[] => [
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
		id: "number",
		header: () =>
			// <div className="text-muted-foreground w-full text-center">No</div>
			null,

		cell: ({ row }) => {
			return (
				<div className="text-muted-foreground text-center">{row.index + 1}</div>
			);
		},
	},
	{
		accessorKey: "murid.namaLengkap",
		header: "Nama Murid",
		cell: ({ row }) => {
			const { murid } = row.original;
			const umur = labelUmurTahun(
				murid.tanggalLahir,
				murid.umur,
				murid.createdAt,
			);
			return (
				<div className="min-w-0">
					<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
						<Link href={`/admin/pembayaran/${murid.id}`}>
							<Button
								variant="link"
								className="text-foreground h-auto min-w-0 w-fit justify-start whitespace-normal break-words px-0 text-left text-base"
							>
								{murid.namaLengkap}
							</Button>
						</Link>
						<span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
							{umur}
						</span>
					</div>
					{murid.kelasSekolah && (
						<div className="text-muted-foreground text-xs">
							{murid.kelasSekolah}
						</div>
					)}
				</div>
			);
		},
		enableHiding: false,
	},
	{
		accessorKey: "murid.noWA",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Kontak
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const noWA = row.original.murid.noWA;
			return (
				<div className="flex min-w-0 items-center gap-2">
					<Link
						href={formatWhatsAppLink(noWA)}
						target="_blank"
						className="flex min-w-0 items-center gap-1 font-medium text-green-600 hover:underline"
						title="Chat WhatsApp"
					>
						<MessageCircle className="h-4 w-4 shrink-0" />
						<span className="truncate text-sm text-green-600">{noWA}</span>
					</Link>
					<Copy
						className="text-muted-foreground hover:text-foreground h-3 w-3 shrink-0 cursor-pointer"
						onClick={async () => {
							await navigator.clipboard.writeText(row.original.murid.noWA);
							toast.success("Nomor WA disalin");
						}}
					/>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
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
			const status = row.original.status;

			return (
				<span
					title={formatStatus(status)}
					className={cn(
						"inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
						statusPendaftaranColorMap[status],
					)}
				>
					<span className="size-1.5 shrink-0 rounded-full bg-current" />
					{formatStatus(status)}
				</span>
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
	{
		id: "sisaPertemuan",
		header: () => <div className="w-full md:text-center">Sisa Pertemuan</div>,
		cell: ({ row }) => {
			const sisa = row.original.sisaPertemuan;
			if (sisa === null) {
				return (
					<div
						className="text-muted-foreground md:text-center"
						title="Tidak dibatasi kuota"
					>
						-
					</div>
				);
			}
			return (
				<div className="md:text-center">
					<span
						className={cn(
							"inline-flex min-w-9 items-center justify-center rounded-md px-2 py-0.5 text-sm font-semibold",
							sisa <= 0
								? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
								: sisa <= 2
									? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300"
									: "bg-muted text-foreground",
						)}
					>
						{sisa}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: "tanggalMulai",
		header: () => (
			<div className="w-full md:text-center">Tanggal Masuk Kelas</div>
		),
		cell: ({ row }) => (
			<div className="md:text-center">
				<div className="text-muted-foreground text-[11px] uppercase tracking-wide md:hidden">
					Tanggal Masuk Kelas
				</div>
				{row.original.tanggalMulai
					? formatDateWITA(row.original.tanggalMulai)
					: "-"}
			</div>
		),
	},
	{
		id: "actions",
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
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() =>
								onDeleteClick(row.original.id, row.original.murid.namaLengkap)
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
