"use client";

import { StatusPendaftaran } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowUpDown,
	Copy,
	EllipsisVertical,
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
import type { RouterOutputs } from "@/trpc/react";
import { formatDateWITA } from "@/utils/dateUtils";
import { formatWhatsAppLink } from "@/utils/noWAUtils";

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
		cell: ({ row }) => (
			<Link href={`/admin/pembayaran/${row.original.murid.id}`}>
				<Button
					variant="link"
					className="text-foreground w-fit px-0 text-left text-base"
				>
					{row.original.murid.namaLengkap}
				</Button>
			</Link>
		),
		enableHiding: false,
	},
	{
		accessorKey: "murid.umur",
		header: "Umur & Kelas Sekolah",
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<div>{row.original.murid.umur}</div> |
				<div>{row.original.murid.kelasSekolah}</div>
			</div>
		),
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
				<div className="flex items-center gap-2">
					<Link
						href={formatWhatsAppLink(noWA)}
						target="_blank"
						className="flex items-center gap-1 font-medium text-green-600 hover:underline"
						title="Chat WhatsApp"
					>
						<MessageCircle className="h-4 w-4" />
						<span className="text-sm text-green-600">{noWA}</span>
					</Link>
					<Copy
						className="text-muted-foreground hover:text-foreground h-3 w-3 cursor-pointer"
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
			let variant: "default" | "secondary" | "destructive" | "outline" =
				"default";
			let label = "Aktif";

			switch (status) {
				case StatusPendaftaran.AKTIF:
					variant = "default";
					label = "Aktif";
					break;
				case StatusPendaftaran.TRIAL:
					variant = "secondary";
					label = "Trial";
					break;
				case StatusPendaftaran.WAITING_LIST:
					variant = "outline"; // Or customized color if possible
					label = "Waiting List";
					break;
				case StatusPendaftaran.NON_AKTIF:
					variant = "destructive";
					label = "Non-Aktif";
					break;
			}

			return <Badge variant={variant}>{label}</Badge>;
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
		accessorKey: "tanggalMulai",
		header: () => <div className="w-full text-center">Tanggal Masuk Kelas</div>,
		cell: ({ row }) => (
			<div className="text-center">
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
