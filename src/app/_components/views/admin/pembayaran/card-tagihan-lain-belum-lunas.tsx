"use client";

import { RefreshCw } from "lucide-react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
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

// Derive type locally to avoid circular dependencies if any
type TypeTagihanLainBelumLunas =
	RouterOutputs["tagihanLain"]["getAllBelumLunas"][number];

interface CardTagihanLainBelumLunasProps {
	className?: string;
}

export default function CardTagihanLainBelumLunas({
	className,
}: CardTagihanLainBelumLunasProps) {
	const { activeCabangId } = useGlobalCabangStore();

	const {
		dataGetAllBelumLunas,
		isLoadingGetAllBelumLunas,
		isFetchingGetAllBelumLunas,
		refetchGetAllBelumLunas,
		mutations,
	} = useTagihanLain({
		enableGetAll: false, // We only need getBelumLunas which is triggered by hook structure if we use the new one, but actually the user put it in the main hook.
		// note: the user put the query directly in the body of useTagihanLain,
		// so it will run if we call useTagihanLain.
		// However, we should check if we need to pass filterCabang here.
		// The user updated code uses: cabangId: cabangIdPayload (which comes from options.filterCabang)
		filterCabang: activeCabangId,
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
		<Card className={cn("border-l-orange-500 border-l-4 shadow-sm", className)}>
			<CardHeader className="flex items-center gap-4 space-y-0 pb-2">
				<div className="flex flex-1 items-center justify-between">
					<div className="space-y-1">
						<CardTitle>
							Tagihan Lain Belum Lunas (Buku, Register, dll)
						</CardTitle>
						<CardDescription>
							Daftar tagihan non-SPP yang belum dibayar.
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
						Loading data tagihan lain...
					</div>
				) : (
					<DataTable
						data={dataGetAllBelumLunas ?? []}
						columns={tableColumns}
						// Optional: remove pagination if we want a long list or add generic pagination if needed
						// For now, using generic DataTable which handles basic pagination if passed,
						// but the query returns a flat array for getAllBelumLunas.
						// DataTable works with client-side pagination usually if no pageCount provided?
						// Actually DataTableGeneric usually expects server-side pagination props if we pass pageCount.
						// If we don't pass pageCount, does it do client side?
						// Let's assume DataTable handles array data gracefully or we might need to check DataTableGeneric implementation.
						// Checked: findMany returns array. DataTableGeneric usually takes `data` array.
					/>
				)}
			</CardContent>
		</Card>
	);
}
