"use client";

import type { KategoriTagihan } from "@prisma/client";
import type { PaginationState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table";
import { columnsTagihanLainBelumLunas } from "@/app/_components/views/admin/pembayaran/columns/columns-tagihan-lain-belum-lunas";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTagihanLain } from "@/hooks/useTagihanLain";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { RouterOutputs } from "@/trpc/react";

type TypeTagihanLainBelumLunas =
	RouterOutputs["tagihanLain"]["getAllBelumLunas"]["data"][number];

interface CardTagihanLainBelumLunasProps {
	className?: string;
	title: string;
	kategori: KategoriTagihan;
}

export default function CardTagihanLainBelumLunas({
	className,
	title,
	kategori,
}: CardTagihanLainBelumLunasProps) {
	const { activeCabangId } = useGlobalCabangStore();
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 50,
	});

	const ROW_SELECTION_KEY = `tagihan-lain-${kategori}-row-selection`;

	useEffect(() => {
		const saved = sessionStorage.getItem(ROW_SELECTION_KEY);
		if (saved) {
			try {
				setRowSelection(JSON.parse(saved));
			} catch (e) {
				console.error("Gagal parsing row selection:", e);
			}
		}
	}, [ROW_SELECTION_KEY]);

	useEffect(() => {
		sessionStorage.setItem(ROW_SELECTION_KEY, JSON.stringify(rowSelection));
	}, [rowSelection, ROW_SELECTION_KEY]);

	const {
		dataGetAllBelumLunas,
		pageCountBelumLunas,
		isLoadingGetAllBelumLunas,
		isFetchingGetAllBelumLunas,
		refetchGetAllBelumLunas,
		mutations,
	} = useTagihanLain({
		enableGetAll: false,
		filterCabang: activeCabangId,
		filterKategori: kategori, // Filter by specific category
		pagination: pagination,
	});

	const handleVerifyClick = (item: TypeTagihanLainBelumLunas) => {
		mutations.markAsPaid.mutate({
			id: item.id,
		});
	};

	const tableColumns = columnsTagihanLainBelumLunas({
		onVerifyClick: handleVerifyClick,
	});

	return (
		<Card className={cn(" border-l-4 shadow-sm", className)}>
			<CardHeader className="flex items-center gap-4 space-y-0 pb-2">
				<div className="flex flex-1 items-center justify-between">
					<div className="space-y-1">
						<CardTitle>{title}</CardTitle>
						<CardDescription>
							Daftar tagihan {kategori} yang belum dibayar.
						</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 shrink-0"
						onClick={() => refetchGetAllBelumLunas()}
						disabled={isLoadingGetAllBelumLunas || isFetchingGetAllBelumLunas}
						title="Refresh Tagihan"
					>
						<RefreshCw
							className={cn(
								"h-4 w-4",
								(isLoadingGetAllBelumLunas || isFetchingGetAllBelumLunas) &&
									"animate-spin",
							)}
						/>
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoadingGetAllBelumLunas ? (
					<div className="text-muted-foreground flex h-64 items-center justify-center">
						Loading data tagihan...
					</div>
				) : (
					<DataTable
						data={dataGetAllBelumLunas ?? []}
						columns={tableColumns}
						pageCount={pageCountBelumLunas}
						pagination={pagination}
						onPaginationChange={setPagination}
						isLoading={isLoadingGetAllBelumLunas || isFetchingGetAllBelumLunas}
						rowSelection={rowSelection}
						onRowSelectionChange={setRowSelection}
						getRowId={(row) => row.id}
					/>
				)}
			</CardContent>
		</Card>
	);
}
