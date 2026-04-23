"use client";

import { StatusPembayaran } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowUpDown,
	CheckCircle,
	CheckCircle2,
	Clock,
	Edit2,
	EllipsisVertical,
	MessageCircle,
	PackageCheck,
	Trash,
	XCircle,
} from "lucide-react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";
import { formatDateWITA } from "@/utils/dateUtils";
import { formatWhatsAppReminder } from "@/utils/noWAUtils";
import { formatStatus, statusPembayaranColorMap } from "@/utils/statusUtils";
import { toRupiah } from "@/utils/toRupiah";

// Type definition inferred from Router
export type TypeTagihanLain =
	RouterOutputs["tagihanLain"]["getAllByMurid"][number];

export const DESKRIPSI_BUKU_OPTIONS = [
	{
		value: "Sudah Diberikan",
		label: "Sudah Diberikan",
		Icon: CheckCircle2,
		colorClass: "text-green-600",
	},
	{
		value: "Ready",
		label: "Ready",
		Icon: PackageCheck,
		colorClass: "text-blue-600",
	},
	{
		value: "Di-order",
		label: "Di-order",
		Icon: Clock,
		colorClass: "text-amber-600",
	},
	{
		value: "Belum Order",
		label: "Belum Order",
		Icon: XCircle,
		colorClass: "text-red-500",
	},
] as const;

interface ColumnsConfig {
	onEditClick: (item: TypeTagihanLain) => void;
	onDeleteClick: (item: TypeTagihanLain) => void;
	onVerifyClick: (item: TypeTagihanLain) => void;
	onDownloadClick: (item: TypeTagihanLain) => void;
	onUpdateDeskripsi?: (id: string, deskripsi: string | null) => void;
	isBuku?: boolean;
}

// Removed local getStatusBadgeVariant as it is now in @/utils/statusUtils

export const columnsTagihanLain = ({
	onEditClick,
	onDeleteClick,
	onVerifyClick,
	onDownloadClick,
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

	{
		id: "nomer",
		accessorKey: "nomer",
		header: "No",
		cell: ({ row }) => row.index + 1,
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
			return (
				<Badge className={cn("font-medium", statusPembayaranColorMap[status])}>
					{formatStatus(status)}
				</Badge>
			);
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

			const noWA = row.original.murid.noWA;
			const namaMurid = row.original.murid.namaLengkap;
			const jumlah = row.original.jumlah;
			const tipe = `pembayaran ${row.original.kategori}`;
			const kelas = row.original.kelas?.kodeKelas || "-";
			const noRekening = row.original.murid.cabang?.noRekening;
			const bank = row.original.murid.cabang?.bank;
			const atasNama = row.original.murid.cabang?.atasNama;

			return (
				<div className="flex items-end gap-2">
					{/* Tombol WA Cepat */}
					{!isLunas && row.original.murid?.noWA && (
						<Button
							asChild
							variant="outline"
							size="icon-sm"
							className="h-8 w-8 border-green-200 text-green-600 hover:bg-green-50"
							title="Hubungi via WhatsApp"
						>
							<Link
								href={formatWhatsAppReminder(
									noWA,
									namaMurid,
									tipe,
									kelas,
									jumlah,
									null,
									noRekening,
									bank,
									atasNama,
									null,
									null,
								)}
								target="_blank"
							>
								<MessageCircle className="h-4 w-4" />
							</Link>
						</Button>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<EllipsisVertical className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{/* Toggle Status */}
							{/* Toggle Status */}
							{!isLunas ? (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
											<CheckCircle className="mr-2 h-4 w-4 text-green-600" />
											Tandai Lunas
										</DropdownMenuItem>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
											<AlertDialogDescription>
												Apakah anda yakin ingin mengubah status tagihan ini
												menjadi Lunas?
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Batal</AlertDialogCancel>
											<AlertDialogAction
												onClick={() => onVerifyClick(row.original)}
											>
												Ya, Lunas
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							) : (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
											<XCircle className="mr-2 h-4 w-4 text-red-600" />
											Batalkan Lunas
										</DropdownMenuItem>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Konfirmasi Pembatalan</AlertDialogTitle>
											<AlertDialogDescription>
												Apakah anda yakin ingin membatalkan status lunas tagihan
												ini?
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Batal</AlertDialogCancel>
											<AlertDialogAction
												className="bg-destructive hover:bg-destructive/80"
												onClick={() => onVerifyClick(row.original)}
											>
												Ya, Batalkan
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}

							<DropdownMenuItem onClick={() => onEditClick(row.original)}>
								<Edit2 className="mr-2 h-4 w-4" />
								Edit
							</DropdownMenuItem>

							{/* Aksi Download jika lunas */}
							{isLunas && (
								<DropdownMenuItem onClick={() => onDownloadClick(row.original)}>
									<svg
										className="mr-2 h-4 w-4"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<title>Download</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									Download Kuitansi
								</DropdownMenuItem>
							)}

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
				</div>
			);
		},
	},
];

export const columnsTagihanLainGlobal = ({
	onEditClick,
	onDeleteClick,
	onVerifyClick,
	onDownloadClick,
	onUpdateDeskripsi,
	isBuku,
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
			return (
				<Badge className={cn("font-medium", statusPembayaranColorMap[status])}>
					{formatStatus(status)}
				</Badge>
			);
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
				Tanggal Dibuat
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const formattedDate = formatDateWITA(row.original.createdAt);
			return <span className="text-sm">{formattedDate}</span>;
		},
	},

	// Tanggal Bayar & Verifikasi (gabungan)
	{
		id: "tanggal",
		header: "Bayar / Verif",
		cell: ({ row }) => {
			const tanggalBayar = row.original.tanggalBayar;
			const verifiedByName = row.original.verifiedBy?.name;
			return (
				<div className="flex flex-col gap-1 text-sm">
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground w-12 text-xs">Bayar:</span>
						{tanggalBayar ? (
							<span className="font-medium text-green-600">
								{formatDateWITA(tanggalBayar)}
							</span>
						) : (
							<span className="text-muted-foreground italic">-</span>
						)}
					</div>
					{verifiedByName && (
						<span className="text-muted-foreground text-[10px]">
							Verif: {verifiedByName}
						</span>
					)}
				</div>
			);
		},
	},

	{
		accessorKey: "deskripsi",
		header: ({ column }) => {
			if (!isBuku) return "Deskripsi";

			const filterValue = column.getFilterValue() as string;

			return (
				<div className="flex items-center gap-2">
					<Select
						value={filterValue ?? "ALL"}
						onValueChange={(val) =>
							column.setFilterValue(val === "ALL" ? undefined : val)
						}
					>
						<SelectTrigger className="h-8 border-dashed bg-transparent w-[140px] text-xs">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground mr-1">Status:</span>
								<SelectValue placeholder="Semua" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL" className="text-xs">
								Semua Status
							</SelectItem>
							{DESKRIPSI_BUKU_OPTIONS.map((opt) => (
								<SelectItem
									key={opt.value}
									value={opt.value}
									className="text-xs"
								>
									<div className="flex items-center gap-2">
										<opt.Icon className={`h-3.5 w-3.5 ${opt.colorClass}`} />
										{opt.label}
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			);
		},
		cell: ({ row }) => {
			const isBuku = row.original.kategori === "BUKU";
			const deskripsi = row.original.deskripsi;

			// Untuk REGISTRASI & LAINNYA: tampilkan teks biasa
			if (!isBuku) {
				return <span className="text-sm">{deskripsi ?? "—"}</span>;
			}

			// Untuk BUKU: cek apakah deskripsi sudah berisi salah satu dari 3 opsi
			const validOptions = DESKRIPSI_BUKU_OPTIONS.map(
				(o) => o.value,
			) as string[];
			const selectValue =
				deskripsi && validOptions.includes(deskripsi) ? deskripsi : undefined;

			// Teks asli (auto-generate) hanya ditampilkan kalau bukan salah satu dari 3 opsi
			const autoText =
				deskripsi && !validOptions.includes(deskripsi) ? deskripsi : null;

			// Icon untuk trigger (opsi yang sedang dipilih)
			const activeOpt = DESKRIPSI_BUKU_OPTIONS.find(
				(o) => o.value === selectValue,
			);

			return (
				<div className="flex flex-col gap-1 min-w-[150px]">
					{autoText && (
						<span className="text-muted-foreground text-xs">{autoText}</span>
					)}
					<Select
						value={selectValue}
						onValueChange={(val) => onUpdateDeskripsi?.(row.original.id, val)}
					>
						<SelectTrigger className="h-8 text-xs">
							{activeOpt ? (
								<div className="flex items-center gap-1.5">
									<activeOpt.Icon
										className={`h-3.5 w-3.5 ${activeOpt.colorClass}`}
									/>
									<span className={activeOpt.colorClass}>
										{activeOpt.label}
									</span>
								</div>
							) : (
								<SelectValue placeholder="Ubah status..." />
							)}
						</SelectTrigger>
						<SelectContent>
							{DESKRIPSI_BUKU_OPTIONS.map((opt) => (
								<SelectItem
									key={opt.value}
									value={opt.value}
									className="text-xs"
								>
									<div className="flex items-center gap-2">
										<opt.Icon className={`h-3.5 w-3.5 ${opt.colorClass}`} />
										{opt.label}
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			);
		},
	},

	// Aksi
	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const isLunas = row.original.status === StatusPembayaran.LUNAS;

			const noWA = row.original.murid.noWA;
			const namaMurid = row.original.murid.namaLengkap;
			const jumlah = row.original.jumlah;
			const tipe = `pembayaran ${row.original.kategori}`;
			const kelas = row.original.kelas?.kodeKelas || "-";
			const noRekening = row.original.murid.cabang?.noRekening;
			const bank = row.original.murid.cabang?.bank;
			const atasNama = row.original.murid.cabang?.atasNama;

			return (
				<div className="flex items-end gap-2">
					{/* Tombol WA Cepat */}
					{!isLunas && row.original.murid?.noWA && (
						<Button
							asChild
							variant="outline"
							size="icon-sm"
							className="h-8 w-8 border-green-200 text-green-600 hover:bg-green-50"
							title="Hubungi via WhatsApp"
						>
							<Link
								href={formatWhatsAppReminder(
									noWA,
									namaMurid,
									tipe,
									kelas,
									jumlah,
									null,
									noRekening,
									bank,
									atasNama,
									null,
									null,
								)}
								target="_blank"
							>
								<MessageCircle className="h-4 w-4" />
							</Link>
						</Button>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<EllipsisVertical className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{/* Toggle Status */}
							{/* Toggle Status */}
							{!isLunas ? (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
											<CheckCircle className="mr-2 h-4 w-4 text-green-600" />
											Tandai Lunas
										</DropdownMenuItem>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
											<AlertDialogDescription>
												Apakah anda yakin ingin mengubah status tagihan ini
												menjadi Lunas?
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Batal</AlertDialogCancel>
											<AlertDialogAction
												onClick={() => onVerifyClick(row.original)}
											>
												Ya, Lunas
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							) : (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
											<XCircle className="mr-2 h-4 w-4 text-red-600" />
											Batalkan Lunas
										</DropdownMenuItem>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Konfirmasi Pembatalan</AlertDialogTitle>
											<AlertDialogDescription>
												Apakah anda yakin ingin membatalkan status lunas tagihan
												ini?
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Batal</AlertDialogCancel>
											<AlertDialogAction
												className="bg-destructive hover:bg-destructive/80"
												onClick={() => onVerifyClick(row.original)}
											>
												Ya, Batalkan
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
							{/* WhatsApp Reminder - Only show for unpaid bills
							{!isLunas && row.original.murid?.noWA && (
								<DropdownMenuItem
									onClick={() => {
										const noWA = row.original.murid?.noWA;
										const namaMurid =
											row.original.murid?.namaLengkap || "Murid";
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
							)} */}
							<DropdownMenuItem onClick={() => onEditClick(row.original)}>
								<Edit2 className="mr-2 h-4 w-4" />
								Edit
							</DropdownMenuItem>

							{/* Aksi Download jika lunas */}
							{isLunas && (
								<DropdownMenuItem onClick={() => onDownloadClick(row.original)}>
									<svg
										className="mr-2 h-4 w-4"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<title>Download</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									Download Kuitansi
								</DropdownMenuItem>
							)}

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
				</div>
			);
		},
	},
];
