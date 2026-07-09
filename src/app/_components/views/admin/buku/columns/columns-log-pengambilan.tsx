"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RouterOutputs } from "@/trpc/react";

export type TypeLogPengambilanBuku =
	RouterOutputs["stokBuku"]["getLogPengambilanBuku"][number];

function formatDateTime(date: Date | string | null | undefined) {
	if (!date) return "-";
	return new Date(date).toLocaleString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

interface ColumnsLogPengambilanProps {
	onDelete: (row: TypeLogPengambilanBuku) => void;
	isMutatingId?: string | null;
}

export const columnsLogPengambilan = ({
	onDelete,
	isMutatingId,
}: ColumnsLogPengambilanProps): ColumnDef<TypeLogPengambilanBuku>[] => [
	{
		id: "nomer",
		header: "No",
		cell: ({ row }) => row.index + 1,
	},
	{
		id: "namaLengkap",
		accessorFn: (row) => row.murid.namaLengkap,
		header: "Nama Siswa",
		cell: ({ row }) => (
			<span className="font-medium">{row.original.murid.namaLengkap}</span>
		),
	},
	{
		id: "kelas",
		header: "Kelas",
		cell: ({ row }) => row.original.kelas?.kodeKelas ?? "-",
	},
	{
		id: "buku",
		header: "Buku",
		cell: ({ row }) => (
			<span>
				{row.original.stokBuku.jenisKelas.nama}{" "}
				<span className="text-muted-foreground">
					— Level {row.original.stokBuku.level}
				</span>
			</span>
		),
	},
	{
		id: "guru",
		header: "Guru Penanggung Jawab",
		cell: ({ row }) => {
			const guruNames = row.original.guruPenerima.map(
				(g) => g.guru.name ?? "Tanpa nama",
			);
			if (guruNames.length === 0)
				return <span className="text-muted-foreground text-xs">-</span>;
			return (
				<div className="flex flex-wrap gap-1">
					{guruNames.map((name) => (
						<Badge key={name} variant="outline" className="text-xs">
							{name}
						</Badge>
					))}
				</div>
			);
		},
	},
	{
		id: "tanggalAmbil",
		header: "Tanggal Diambil",
		cell: ({ row }) => (
			<div className="flex items-center gap-1.5 text-sm">
				<CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
				{formatDateTime(row.original.tanggalAmbil)}
			</div>
		),
	},
	{
		id: "cabang",
		header: "Cabang",
		cell: ({ row }) => row.original.stokBuku.cabang.namaCabang,
	},
	{
		id: "aksi",
		header: "",
		cell: ({ row }) => (
			<Button
				variant="ghost"
				size="icon"
				className="text-destructive h-8 w-8"
				disabled={isMutatingId === row.original.id}
				onClick={() => onDelete(row.original)}
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		),
	},
];
