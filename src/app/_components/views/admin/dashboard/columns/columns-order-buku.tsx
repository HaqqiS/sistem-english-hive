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
import type { RouterOutputs } from "@/trpc/react";

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
		id: "status",
		header: "Status Order",
		cell: ({ row }) => {
			const status = row.original.statusOrderBuku;
			const isMutating = row.original.id === isMutatingId;

			const getStatusConfig = (s: StatusOrderBuku) => {
				switch (s) {
					case StatusOrderBuku.SUDAH_DI_ORDER:
						return {
							label: "Sudah Order",
							variant: "default" as const,
							className: "bg-green-500 hover:bg-green-600 text-white",
							icon: <Check className="h-3 w-3" />,
						};
					case StatusOrderBuku.PENDING_APPROVAL:
						return {
							label: "Pending Approval",
							variant: "secondary" as const,
							className: "bg-yellow-500 hover:bg-yellow-600 text-white",
							icon: <Clock className="h-3 w-3" />,
						};
					case StatusOrderBuku.TIDAK_LANJUT:
						return {
							label: "Tidak Lanjut",
							variant: "outline" as const,
							className: "text-muted-foreground",
							icon: <XCircle className="h-3 w-3" />,
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
								onStatusChange(row.original.id, StatusOrderBuku.TIDAK_LANJUT)
							}
							className="gap-2"
						>
							<XCircle className="h-4 w-4 text-muted-foreground" />
							<span>Tidak Lanjut</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								onStatusChange(
									row.original.id,
									StatusOrderBuku.PENDING_APPROVAL,
								)
							}
							className="gap-2"
						>
							<Clock className="h-4 w-4 text-yellow-500" />
							<span>Pending Approval</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								onStatusChange(row.original.id, StatusOrderBuku.SUDAH_DI_ORDER)
							}
							className="gap-2"
						>
							<Check className="h-4 w-4 text-green-500" />
							<span>Sudah Order</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "kodeKelas",
		header: "Kode Kelas",
	},
	{
		id: "guru",
		header: "Guru Aktif",
		cell: ({ row }) => {
			const guru = row.original.historyGuruKelases?.[0]?.guru?.name;
			return <span>{guru ?? "-"}</span>;
		},
	},
	{
		id: "jumlahSesi",
		header: "Jumlah Sesi",
		cell: ({ row }) => {
			return <span>{row.original._count.sesiPertemuanKelases}</span>;
		},
	},
];
