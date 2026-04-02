"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import type { RouterOutputs } from "@/trpc/react";

export type TypeKelasSiapOrderBuku =
	RouterOutputs["kelas"]["getKelasSiapOrderBuku"][number];

interface ColumnsOrderBukuProps {
	checkedKelasIds: string[];
	onToggleCheck: (kelasId: string) => void;
}

export const columnsOrderBuku = ({
	checkedKelasIds,
	onToggleCheck,
}: ColumnsOrderBukuProps): ColumnDef<TypeKelasSiapOrderBuku>[] => [
	{
		id: "select",
		header: "Sudah Order?",
		cell: ({ row }) => (
			<Checkbox
				checked={checkedKelasIds.includes(row.original.id)}
				onCheckedChange={() => onToggleCheck(row.original.id)}
				aria-label="Select row"
				className="translate-y-[2px]"
			/>
		),
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
