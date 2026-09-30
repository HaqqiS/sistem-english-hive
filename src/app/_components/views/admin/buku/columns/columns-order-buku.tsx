"use client";
import { StatusOrderBuku } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, ChevronDown, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BATAS_SESI } from "@/constants/pembayaran";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";
import { formatStatus, statusOrderBukuColorMap } from "@/utils/statusUtils";

export type TypeKelasSiapOrderBuku =
	RouterOutputs["kelas"]["getKelasSiapOrderBuku"][number];

interface ColumnsOrderBukuProps {
	onStatusChange: (kelasId: string, status: StatusOrderBuku) => void;
	isMutatingId?: string | null;
}

export const columnsOrderBuku = ({
	onStatusChange,
	isMutatingId,
}: ColumnsOrderBukuProps): ColumnDef<TypeKelasSiapOrderBuku>[] => [
	{
		accessorKey: "kodeKelas",
		header: "Kelas",
		cell: ({ row }) => {
			const k = row.original;
			const guru = k.historyGuruKelases?.[0]?.guru?.name;
			return (
				<div className="space-y-0.5">
					<div className="truncate font-medium">{k.kodeKelas}</div>
					<div className="text-muted-foreground truncate text-xs">
						{guru ?? "-"}
					</div>
				</div>
			);
		},
	},
	{
		id: "jumlahSesi",
		header: "Pertemuan",
		cell: ({ row }) => {
			const sesi = row.original._count.sesiPertemuanKelases;
			const persen = Math.min(100, Math.round((sesi / BATAS_SESI) * 100));
			return (
				<div className="w-full max-w-32 space-y-1">
					<div className="text-sm font-medium">
						{sesi}
						<span className="text-muted-foreground font-normal">
							{" "}
							/ {BATAS_SESI}
						</span>
					</div>
					<div className="bg-muted h-1.5 overflow-hidden rounded-full">
						<div
							className="bg-primary h-full rounded-full"
							style={{ width: `${persen}%` }}
						/>
					</div>
				</div>
			);
		},
	},
	{
		id: "rencanaNaik",
		header: "Naik ke",
		cell: ({ row }) => {
			const r = row.original.rencanaNaik;
			if (!r.adaTujuan || r.level === null) {
				return (
					<span className="text-muted-foreground text-xs">
						Tidak ada program lanjutan
					</span>
				);
			}
			return (
				<div className="space-y-0.5">
					<div className="truncate font-medium">
						{r.jenisKelasNama} · Level {r.level}
					</div>
					<div className="text-muted-foreground text-xs">
						{r.kelasSudahAda
							? `${r.jumlahSiswaAktif} siswa aktif`
							: "Kelas belum dibuat"}
					</div>
				</div>
			);
		},
	},
	{
		id: "status",
		header: "Status Order",
		cell: ({ row }) => {
			const status = row.original.statusOrderBuku;
			const isMutating = row.original.id === isMutatingId;

			const getStatusConfig = (s: StatusOrderBuku) => {
				const baseConfig = {
					label: formatStatus(s),
					className: cn("border-none", statusOrderBukuColorMap[s]),
				};

				switch (s) {
					case StatusOrderBuku.SUDAH_DIPESAN:
						return {
							...baseConfig,
							variant: "outline" as const,
							icon: <Check className="h-3 w-3" />,
						};
					case StatusOrderBuku.MENUNGGU_PERSETUJUAN:
						return {
							...baseConfig,
							variant: "outline" as const,
							icon: <Clock className="h-3 w-3" />,
						};
					case StatusOrderBuku.DIBATALKAN:
						return {
							...baseConfig,
							variant: "outline" as const,
							icon: <XCircle className="h-3 w-3" />,
						};
					default:
						return {
							...baseConfig,
							variant: "outline" as const,
							icon: <Clock className="h-3 w-3" />,
						};
				}
			};

			const config = getStatusConfig(status);

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 gap-2 px-2 focus-visible:ring-0"
							disabled={isMutating}
						>
							<Badge variant={config.variant} className={config.className}>
								{config.icon}
								{config.label}
							</Badge>
							<ChevronDown className="h-3 w-3 opacity-50" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							onClick={() =>
								onStatusChange(row.original.id, StatusOrderBuku.BELUM_DIPROSES)
							}
							className="gap-2"
						>
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span>Belum Diproses</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								onStatusChange(row.original.id, StatusOrderBuku.DIBATALKAN)
							}
							className="gap-2"
						>
							<XCircle className="h-4 w-4 text-destructive" />
							<span>Dibatalkan</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								onStatusChange(
									row.original.id,
									StatusOrderBuku.MENUNGGU_PERSETUJUAN,
								)
							}
							className="gap-2"
						>
							<Clock className="h-4 w-4 text-yellow-500" />
							<span>Menunggu Persetujuan</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								onStatusChange(row.original.id, StatusOrderBuku.SUDAH_DIPESAN)
							}
							className="gap-2"
						>
							<Check className="h-4 w-4 text-green-500" />
							<span>Sudah Dipesan</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
		enableSorting: false,
		enableHiding: false,
	},
];
