"use client";

import { StatusPembayaran } from "@prisma/client";
import type { PaginationState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table";
import { columnsJatuhTempo } from "@/app/_components/views/admin/pembayaran/columns/columns-jatuh-tempo";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { usePembayaran } from "@/hooks/usePembayaran";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { TypePembayaranJatuhTempo } from "@/types/pembayaran.type";

interface CardJatuhTempoProps {
	className?: string;
}

export default function CardJatuhTempo({ className }: CardJatuhTempoProps) {
	const { activeCabangId } = useGlobalCabangStore();
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 50,
	});

	const ROW_SELECTION_KEY = "jatuh-tempo-row-selection";

	useEffect(() => {
		const saved = sessionStorage.getItem(ROW_SELECTION_KEY);
		if (saved) {
			try {
				setRowSelection(JSON.parse(saved));
			} catch (e) {
				console.error("Gagal parsing row selection:", e);
			}
		}
	}, []);

	useEffect(() => {
		sessionStorage.setItem(ROW_SELECTION_KEY, JSON.stringify(rowSelection));
	}, [rowSelection]);

	const {
		dataJatuhTempo,
		pageCountJatuhTempo,
		isLoadingJatuhTempo,
		isRefetchingJatuhTempo,
		refetchJatuhTempo: refetch,

		mutations,
	} = usePembayaran({
		enableGetJatuhTempo: true,
		enableGetAll: false,
		filterCabang: activeCabangId,
		pagination: pagination,
	});

	// Handler Verifikasi Cepat
	const handleVerifyClick = (item: TypePembayaranJatuhTempo) => {
		mutations.update.mutate({
			id: item.id,
			jumlahBayar: item.jumlahBayar,
			statusBayar: StatusPembayaran.LUNAS, // Langsung set LUNAS
			tanggalBayar: new Date().toISOString(), // Tanggal hari ini
			note: item.note ?? undefined,
		});
	};

	const tableColumns = columnsJatuhTempo({
		onVerifyClick: handleVerifyClick,
	});

	return (
		<Card className={cn("border-l-accent border-l-4 shadow-sm", className)}>
			<CardHeader className="flex items-center gap-4 space-y-0 pb-2">
				<div className="flex flex-1 items-center justify-between">
					<div className="space-y-1">
						<CardTitle>Tagihan Jatuh Tempo (14 Hari ke Depan)</CardTitle>
						<CardDescription>
							Daftar siswa yang perlu diingatkan.
						</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 shrink-0"
						onClick={() => refetch()}
						disabled={isLoadingJatuhTempo || isRefetchingJatuhTempo}
						title="Refresh Jadwal"
					>
						<RefreshCw
							className={cn(
								"h-4 w-4",
								(isLoadingJatuhTempo || isRefetchingJatuhTempo) &&
									"animate-spin",
							)}
						/>
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoadingJatuhTempo ? (
					<div className="text-muted-foreground flex h-64 items-center justify-center">
						Loading data tagihan...
					</div>
				) : (
					<DataTable
						data={dataJatuhTempo ?? []}
						columns={tableColumns}
						pageCount={pageCountJatuhTempo}
						pagination={pagination}
						onPaginationChange={setPagination}
						isLoading={isLoadingJatuhTempo || isRefetchingJatuhTempo}
						rowSelection={rowSelection}
						onRowSelectionChange={setRowSelection}
						getRowId={(row) => row.id}
					/>
				)}
			</CardContent>
		</Card>
	);
}
