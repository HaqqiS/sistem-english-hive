"use client";

import { ClipboardList, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";
import {
	columnsLogPengambilan,
	type TypeLogPengambilanBuku,
} from "./columns/columns-log-pengambilan";

export default function LogPengambilanClient() {
	const { activeCabangId } = useGlobalCabangStore();
	const queryCabangId = activeCabangId === "ALL" ? undefined : activeCabangId;
	const utils = api.useUtils();

	const [deleteTarget, setDeleteTarget] =
		useState<TypeLogPengambilanBuku | null>(null);

	const { data: logList, isLoading } =
		api.stokBuku.getLogPengambilanBuku.useQuery({ cabangId: queryCabangId });

	const deleteLog = api.stokBuku.deleteLogPengambilan.useMutation({
		onSuccess: async () => {
			toast.success("Log dan data siswa/order-nya berhasil dihapus permanen.");
			setDeleteTarget(null);
			await Promise.all([
				utils.stokBuku.getLogPengambilanBuku.invalidate(),
				utils.stokBuku.getAllStokBuku.invalidate(),
				utils.stokBuku.getPenerimaForGuru.invalidate(),
			]);
		},
		onError: (err) => toast.error(err.message ?? "Gagal menghapus log"),
	});

	const columns = columnsLogPengambilan({
		onDelete: (row) => setDeleteTarget(row),
		isMutatingId: deleteLog.isPending
			? deleteLog.variables?.penerimaBukuId
			: null,
	});

	return (
		<>
			<Card className="border-l-4 border-l-blue-500 shadow-sm">
				<CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
						<ClipboardList className="h-6 w-6" />
					</div>
					<div className="space-y-1">
						<CardTitle className="text-xl">Log Pengambilan Buku</CardTitle>
						<CardDescription>
							Riwayat siswa yang bukunya sudah diambil, lengkap dengan tanggal
							dan guru penanggung jawab.
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="pt-4">
					{isLoading ? (
						<div className="text-muted-foreground flex h-96 items-center justify-center rounded-md border border-dashed">
							<div className="flex flex-col items-center gap-2">
								<RefreshCw className="h-8 w-8 animate-spin opacity-20" />
								<span>Memuat data log...</span>
							</div>
						</div>
					) : (
						<DataTable
							data={logList ?? []}
							columns={columns}
							filterColumnPlaceholder="Cari nama siswa..."
							filterColumnId="namaLengkap"
						/>
					)}
				</CardContent>
			</Card>

			<DeleteConfirmationDialog
				isOpen={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				title="Hapus Log Pengambilan?"
				description={
					deleteTarget ? (
						<>
							Log pengambilan buku untuk{" "}
							<span className="font-semibold">
								{deleteTarget.murid.namaLengkap}
							</span>{" "}
							akan <span className="font-semibold">dihapus permanen</span>,
							termasuk data order buku siswa ini. Stok buku{" "}
							<span className="font-semibold">tidak</span> akan ditambah
							kembali. Tindakan ini tidak bisa dibatalkan.
						</>
					) : (
						""
					)
				}
				confirmText="Ya, Hapus"
				cancelText="Batal"
				isLoading={deleteLog.isPending}
				onConfirm={() => {
					if (!deleteTarget) return;
					deleteLog.mutate({ penerimaBukuId: deleteTarget.id });
				}}
			/>
		</>
	);
}
