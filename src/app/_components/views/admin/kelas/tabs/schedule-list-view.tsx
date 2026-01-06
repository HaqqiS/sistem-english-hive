"use client";

import { useMemo } from "react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import type { TypeJadwalKelas } from "@/types/jadwalKelas.type";
import { columns } from "../columns/columns-jadwal";

interface ScheduleListViewProps {
	data?: TypeJadwalKelas[];
	isLoading: boolean;
	onEdit: (item: TypeJadwalKelas) => void;
	onDelete: (id: string, deskripsi: string) => void;
}

export function ScheduleListView({
	data,
	isLoading,
	onEdit,
	onDelete,
}: ScheduleListViewProps) {
	const tableColumns = useMemo(
		() =>
			columns({
				onEditClick: onEdit,
				onDeleteClick: onDelete,
			}),
		[onEdit, onDelete],
	);

	return (
		<div className="w-full">
			<DataTable
				columns={tableColumns}
				data={data ?? []}
				isLoading={isLoading}
			/>
		</div>
	);
}
