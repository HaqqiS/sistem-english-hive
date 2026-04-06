"use client";

import type { StatusOrderBuku } from "@prisma/client";
import { BookOpen, RefreshCw } from "lucide-react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useKelas } from "@/hooks/useKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { columnsOrderBuku } from "./columns/columns-order-buku";

export default function BookOrderClient() {
	const { activeCabangId } = useGlobalCabangStore();

	const {
		dataKelasOrderBuku,
		isLoadingKelasOrderBuku,
		isFetchingKelasOrderBuku,
		mutations,
		refetchKelasOrderBuku,
	} = useKelas({
		enableQueryGetKelasSiapOrderBuku: true,
		filterCabang: activeCabangId,
	});

	const isProcessing = isLoadingKelasOrderBuku || isFetchingKelasOrderBuku;

	const handleRefresh = async () => {
		await refetchKelasOrderBuku();
	};

	const handleStatusChange = (kelasId: string, status: StatusOrderBuku) => {
		mutations.updateStatusOrderBuku.mutate({ kelasId, status });
	};

	const tableColumns = columnsOrderBuku({
		onStatusChange: handleStatusChange,
		isMutatingId: mutations.updateStatusOrderBuku.isPending
			? mutations.updateStatusOrderBuku.variables?.kelasId
			: null,
	});

	return (
		<div className="space-y-4">
			<HeaderActionPortal>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						className="h-9 w-9 shrink-0"
						onClick={handleRefresh}
						disabled={isProcessing}
						title="Refresh Daftar"
					>
						<RefreshCw
							className={cn("h-4 w-4", isProcessing && "animate-spin")}
						/>
					</Button>
				</div>
			</HeaderActionPortal>

			<Card className="border-l-4 shadow-sm border-l-green-500">
				<CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
						<BookOpen className="h-6 w-6" />
					</div>
					<div className="space-y-1">
						<CardTitle className="text-xl">Daftar Order Buku Kelas</CardTitle>
						<CardDescription>
							Mengelola pemesanan buku untuk semua kelas yang sedang berjalan
							(RUNNING).
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="pt-4">
					{isLoadingKelasOrderBuku ? (
						<div className="text-muted-foreground flex h-96 items-center justify-center border rounded-md border-dashed">
							<div className="flex flex-col items-center gap-2">
								<RefreshCw className="h-8 w-8 animate-spin opacity-20" />
								<span>Memuat data kelas...</span>
							</div>
						</div>
					) : (
						<DataTable
							data={dataKelasOrderBuku ?? []}
							columns={tableColumns}
							filterColumnPlaceholder="Cari kode kelas..."
							filterColumnId="kodeKelas"
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
