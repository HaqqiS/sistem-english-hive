"use client";

import { RefreshCw } from "lucide-react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useOrderBuku } from "@/hooks/useKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";
import { columnsOrderBuku } from "./columns/columns-order-buku";

interface CardKelasOrderBukuProps {
	className?: string;
}

export default function CardKelasOrderBuku({
	className,
}: CardKelasOrderBukuProps) {
	const { activeCabangId } = useGlobalCabangStore();

	const { kelasList, isLoading, checkedKelasIds, toggleCheck } =
		useOrderBuku(activeCabangId);

	// Kita bisa menggunakan trpc context untuk refetch manual
	const utils = api.useUtils();
	const handleRefresh = async () => {
		await utils.kelas.getKelasSiapOrderBuku.invalidate({
			cabangId: activeCabangId,
		});
	};

	const tableColumns = columnsOrderBuku({
		checkedKelasIds,
		onToggleCheck: toggleCheck,
	});

	return (
		<Card className={cn("border-l-4 shadow-sm border-l-green-500", className)}>
			<CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
				<div className="flex flex-1 items-center justify-between">
					<div className="space-y-1">
						<CardTitle>Kelas Siap Order Buku</CardTitle>
						<CardDescription>
							Daftar kelas yang sudah mencapai 16 - 24 sesi pertemuan.
						</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 shrink-0"
						onClick={handleRefresh}
						disabled={isLoading}
						title="Refresh Daftar Kelas"
					>
						<RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="text-muted-foreground flex h-64 items-center justify-center">
						Loading data kelas...
					</div>
				) : (
					<DataTable data={kelasList ?? []} columns={tableColumns} />
				)}
			</CardContent>
		</Card>
	);
}
