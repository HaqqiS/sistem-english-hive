"use client";

import { StatusPembayaran } from "@prisma/client";
import { RefreshCw } from "lucide-react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
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

export default function DashboardClientPage() {
	const { activeCabangId } = useGlobalCabangStore();

	const {
		dataJatuhTempo,
		isLoadingJatuhTempo,
		isRefetchingJatuhTempo,
		refetchJatuhTempo: refetch,

		mutations,
	} = usePembayaran({
		enableGetJatuhTempo: true, // Aktifkan query khusus dashboard
		enableGetAll: false, // Matikan query berat (getAll) di dashboard
		filterCabang: activeCabangId,
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
		<div className="space-y-6">
			<Card className="border-l-accent border-l-4 shadow-sm">
				<CardHeader className="flex items-center gap-4 space-y-0 pb-2">
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
					<div className="space-y-2">
						<CardTitle>Tagihan Jatuh Tempo (14 Hari ke Depan)</CardTitle>
						<CardDescription>
							Daftar siswa yang perlu diingatkan untuk pembayaran periode ini.
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingJatuhTempo ? (
						<div className="text-muted-foreground flex h-32 items-center justify-center">
							Loading data tagihan...
						</div>
					) : (
						<DataTable data={dataJatuhTempo ?? []} columns={tableColumns} />
					)}
				</CardContent>
			</Card>
		</div>
	);
}
