"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useJadwalKelasStore } from "@/store/useJadwalKelasStore";
import type { TypeJadwalKelas } from "@/types/jadwalKelas.type";
import EditJadwalKelas from "../../jadwal/edit-jadwal";
import { ScheduleListView } from "./schedule-list-view";

export default function JadwalTableView() {
	const { activeCabangId } = useGlobalCabangStore();
	const { openDrawer } = useJadwalKelasStore();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<{
		id: string;
		deskripsi: string;
	} | null>(null);

	const {
		dataJadwalRunning,
		isLoadingDataJadwalRunning,
		dataJadwalTrial,
		isLoadingDataJadwalTrial,
		dataJadwalWaiting,
		isLoadingDataJadwalWaiting,
		mutations,
		invalidate,
	} = useJadwalKelas({
		filterCabang: activeCabangId,
		enableQueryAllRunning: true,
		enableQueryAllTrial: true,
		enableQueryAllWaiting: true,
		onSuccessDelete: () => {
			setDeleteDialogOpen(false);
			setItemToDelete(null);
		},
	});

	// Handlers
	const handleEdit = (item: TypeJadwalKelas) => {
		openDrawer("edit", item);
	};

	const handleDelete = (id: string, deskripsi: string) => {
		setItemToDelete({ id, deskripsi });
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (itemToDelete) {
			await mutations.delete.mutateAsync({ id: itemToDelete.id });
		}
	};

	const handleRefetch = () => {
		invalidate();
	};

	const isAnyLoading =
		isLoadingDataJadwalRunning ||
		isLoadingDataJadwalTrial ||
		isLoadingDataJadwalWaiting;

	return (
		<div className="flex h-full flex-col gap-4">
			<div className="flex flex-1 items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0"
					disabled={isAnyLoading}
					onClick={handleRefetch}
					title="Refresh Jadwal"
				>
					<RefreshCw
						className={cn("h-4 w-4", isAnyLoading && "animate-spin")}
					/>
				</Button>
				<div>
					<h1 className="text-xl">Daftar Jadwal</h1>
				</div>
			</div>

			<Tabs defaultValue="running" className="w-full">
				<TabsList>
					<TabsTrigger value="running">
						Running ({dataJadwalRunning?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="trial">
						Trial ({dataJadwalTrial?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="waiting">
						Waiting ({dataJadwalWaiting?.length ?? 0})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="running" className="mt-4">
					<ScheduleListView
						data={dataJadwalRunning}
						isLoading={isLoadingDataJadwalRunning}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				</TabsContent>

				<TabsContent value="trial" className="mt-4">
					<ScheduleListView
						data={dataJadwalTrial}
						isLoading={isLoadingDataJadwalTrial}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				</TabsContent>

				<TabsContent value="waiting" className="mt-4">
					<ScheduleListView
						data={dataJadwalWaiting}
						isLoading={isLoadingDataJadwalWaiting}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				</TabsContent>
			</Tabs>

			{/* Shared Components */}
			<EditJadwalKelas />
			<DeleteConfirmationDialog
				isOpen={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Hapus Jadwal"
				description={
					<>
						Yakin ingin menghapus jadwal{" "}
						<span className="font-bold text-accent">
							{itemToDelete?.deskripsi}
						</span>
						? Tindakan ini tidak dapat dibatalkan.
					</>
				}
				onConfirm={handleConfirmDelete}
				isLoading={mutations.delete.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>
		</div>
	);
}
