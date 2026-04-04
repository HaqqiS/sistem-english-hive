"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import type { RouterOutputs } from "@/trpc/react";

export type TypeKelasSiapOrderBuku =
	RouterOutputs["kelas"]["getKelasSiapOrderBuku"][number];

interface ColumnsOrderBukuProps {
	onToggleCheck: (kelasId: string, status: boolean) => void;
	isMutatingId?: string | null;
}

export const columnsOrderBuku = ({
	onToggleCheck,
	isMutatingId,
}: ColumnsOrderBukuProps): ColumnDef<TypeKelasSiapOrderBuku>[] => [
	{
		id: "select",
		header: "Sudah Order?",
		cell: ({ row }) => {
			const isMutating = row.original.id === isMutatingId;
			return (
				<Checkbox
					checked={row.original.isOrderBuku}
					onCheckedChange={(checked) => onToggleCheck(row.original.id, !!checked)}
					aria-label="Select row"
					className="translate-y-[2px]"
					disabled={isMutating}
				/>
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
