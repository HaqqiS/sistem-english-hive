"use client";

import { StatusPembayaran } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowUpDown,
	CheckCircle,
	Edit2,
	EllipsisVertical,
	MessageCircle,
	Trash,
	XCircle,
} from "lucide-react";
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
import { toRupiah } from "@/utils/toRupiah";

// Type definition inferred from Router
export type TypeTagihanLain =
	RouterOutputs["tagihanLain"]["getAllByMurid"][number];

interface ColumnsConfig {
	onEditClick: (item: TypeTagihanLain) => void;
	onDeleteClick: (item: TypeTagihanLain) => void;
	onVerifyClick: (item: TypeTagihanLain) => void;
}

const getStatusBadgeVariant = (
	status: StatusPembayaran,
): "default" | "destructive" | "secondary" | "outline" => {
	switch (status) {
		case StatusPembayaran.LUNAS:
			return "default"; // Green
		case StatusPembayaran.BELUM_LUNAS:
			return "destructive"; // Red
		default:
			return "outline";
	}
};

export const columnsTagihanLain = ({
	onEditClick,
	onDeleteClick,
	onVerifyClick,
}: ColumnsConfig): ColumnDef<TypeTagihanLain>[] => [
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

	// Kategori
	{
		accessorKey: "kategori",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Kategori
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => <Badge variant="outline">{row.original.kategori}</Badge>,
	},

	// Judul & Deskripsi
	{
		accessorKey: "judul",
		header: "Keterangan",
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium">{row.original.judul}</span>
				{row.original.deskripsi && (
					<span className="text-muted-foreground text-xs">
						{row.original.deskripsi}
					</span>
				)}
			</div>
		),
	},

	// Jumlah
	{
		accessorKey: "jumlah",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Nominal
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<div className="min-w-[100px] font-medium">
				{toRupiah(row.original.jumlah)}
			</div>
		),
	},

	// Status
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
			return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
		},
	},

	// Tanggal Dibuat
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Tanggal
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const formattedDate = formatDateWITA(row.original.createdAt);
			return <span className="text-sm">{formattedDate}</span>;
		},
	},

	// Aksi
	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const isLunas = row.original.status === StatusPembayaran.LUNAS;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<EllipsisVertical className="h-4 w-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{/* Toggle Status */}
						{!isLunas ? (
							<DropdownMenuItem onClick={() => onVerifyClick(row.original)}>
								<CheckCircle className="mr-2 h-4 w-4 text-green-600" />
								Tandai Lunas
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem onClick={() => onVerifyClick(row.original)}>
								<XCircle className="mr-2 h-4 w-4 text-red-600" />
								Batalkan Lunas
							</DropdownMenuItem>
						)}

						{/* WhatsApp Reminder - Only show for unpaid bills */}
						{!isLunas && row.original.murid?.noWA && (
							<DropdownMenuItem
								onClick={() => {
									const noWA = row.original.murid?.noWA;
									const namaMurid = row.original.murid?.namaLengkap || "Murid";
									const kategori = row.original.kategori;
									const judul = row.original.judul;
									const nominal = new Intl.NumberFormat("id-ID", {
										style: "currency",
										currency: "IDR",
									}).format(row.original.jumlah);

									const message = `Halo ${namaMurid},\n\nKami ingin mengingatkan bahwa terdapat tagihan yang belum diselesaikan:\n\n *${kategori}: ${judul}*\n Nominal: ${nominal}\n\nMohon untuk segera menyelesaikan pembayaran.\n\nTerima kasih!`;

									const url = `https://wa.me/${noWA}?text=${encodeURIComponent(message)}`;
									window.open(url, "_blank");
								}}
							>
								<MessageCircle className="mr-2 h-4 w-4 text-green-600" />
								Kirim Tagihan via WA
							</DropdownMenuItem>
						)}

						<DropdownMenuItem onClick={() => onEditClick(row.original)}>
							<Edit2 className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => onDeleteClick(row.original)}
						>
							<Trash className="mr-2 h-4 w-4" />
							Hapus
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

export const columnsTagihanLainGlobal = ({
	onEditClick,
	onDeleteClick,
	onVerifyClick,
}: ColumnsConfig): ColumnDef<TypeTagihanLain>[] => [
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

	// Nama Murid (Global Specific)
	{
		id: "namaMurid",
		accessorFn: (row) => row.murid?.namaLengkap,
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Nama Murid
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const murid = row.original.murid;
			return (
				<div className="flex flex-col">
					<span className="font-medium">{murid?.namaLengkap}</span>
					<span className="text-muted-foreground text-xs">
						{row.original.kelas?.kodeKelas}
					</span>
				</div>
			);
		},
	},

	// Kategori
	{
		accessorKey: "kategori",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Kategori
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => <Badge variant="outline">{row.original.kategori}</Badge>,
	},

	// Judul & Deskripsi
	{
		accessorKey: "judul",
		header: "Keterangan",
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium">{row.original.judul}</span>
				{row.original.deskripsi && (
					<span className="text-muted-foreground text-xs">
						{row.original.deskripsi}
					</span>
				)}
			</div>
		),
	},

	// Jumlah
	{
		accessorKey: "jumlah",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Nominal
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => (
			<div className="min-w-[100px] font-medium">
				{toRupiah(row.original.jumlah)}
			</div>
		),
	},

	// Status
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
			return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
		},
	},

	// Tanggal Dibuat
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			>
				Tanggal
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const formattedDate = formatDateWITA(row.original.createdAt);
			return <span className="text-sm">{formattedDate}</span>;
		},
	},
	// Deskripsi
	{
		accessorKey: "deskripsi",
		header: "Deskripsi",
		cell: ({ row }) => row.original.deskripsi,
	},

	// Aksi
	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const isLunas = row.original.status === StatusPembayaran.LUNAS;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<EllipsisVertical className="h-4 w-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{/* Toggle Status */}
						{!isLunas ? (
							<DropdownMenuItem onClick={() => onVerifyClick(row.original)}>
								<CheckCircle className="mr-2 h-4 w-4 text-green-600" />
								Tandai Lunas
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem onClick={() => onVerifyClick(row.original)}>
								<XCircle className="mr-2 h-4 w-4 text-red-600" />
								Batalkan Lunas
							</DropdownMenuItem>
						)}

						{/* WhatsApp Reminder - Only show for unpaid bills */}
						{!isLunas && row.original.murid?.noWA && (
							<DropdownMenuItem
								onClick={() => {
									const noWA = row.original.murid?.noWA;
									const namaMurid = row.original.murid?.namaLengkap || "Murid";
									const kategori = row.original.kategori;
									const judul = row.original.judul;
									const nominal = new Intl.NumberFormat("id-ID", {
										style: "currency",
										currency: "IDR",
									}).format(row.original.jumlah);

									const message = `Halo ${namaMurid},\n\nKami ingin mengingatkan bahwa terdapat tagihan yang belum diselesaikan:\n\n📋 *${kategori}: ${judul}*\n💰 Nominal: ${nominal}\n\nMohon untuk segera menyelesaikan pembayaran.\n\nTerima kasih! 🙏`;

									const url = `https://wa.me/${noWA}?text=${encodeURIComponent(message)}`;
									window.open(url, "_blank");
								}}
							>
								<MessageCircle className="mr-2 h-4 w-4 text-green-600" />
								Kirim Tagihan via WA
							</DropdownMenuItem>
						)}

						<DropdownMenuItem onClick={() => onEditClick(row.original)}>
							<Edit2 className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onClick={() => onDeleteClick(row.original)}
						>
							<Trash className="mr-2 h-4 w-4" />
							Hapus
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
