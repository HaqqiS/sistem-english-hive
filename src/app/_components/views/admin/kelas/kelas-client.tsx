"use client";

import { useState } from "react";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import EditJadwalKelas from "../jadwal/edit-jadwal";
import ScheduleGrid from "../jadwal/schedule-view/schedule-grid";
import TambahJadwalKelas from "../jadwal/tambah-jadwal";
import JadwalTableView from "./tabs/jadwal-table-view";
import KelasTab from "./tabs/kelas-tab";

export default function KelasClient() {
	const { activeCabangId } = useGlobalCabangStore();

	const [deleteJadwalDialogOpen, setDeleteJadwalDialogOpen] = useState(false);
	const [selectedJadwalToDelete, setSelectedJadwalToDelete] = useState<{
		id: string;
		deskripsi: string;
	} | null>(null);

	// const { openDrawer } = useJadwalKelasStore();

	const { mutations: jadwalMutation } = useJadwalKelas({
		enableQueryAllRunning: true,
		enableQueryHariIni: false,
		filterCabang: activeCabangId,
		onSuccessDelete: () => {
			setDeleteJadwalDialogOpen(false);
			setSelectedJadwalToDelete(null);
		},
	});

	const handleConfirmDeleteJadwal = async () => {
		if (!selectedJadwalToDelete) return;

		await jadwalMutation.delete.mutateAsync({ id: selectedJadwalToDelete.id });
	};

	return (
		<Tabs defaultValue="listKelas">
			<TabsList>
				<TabsTrigger value="listKelas">List Kelas</TabsTrigger>
				<TabsTrigger value="penjadwalanKelas">Penjadwalan Kelas</TabsTrigger>
				<TabsTrigger value="jadwalTable">Table Jadwal</TabsTrigger>
			</TabsList>
			<TabsContent value="listKelas">
				<KelasTab />
			</TabsContent>

			<TabsContent
				value="penjadwalanKelas"
				className="flex h-full flex-1 flex-col"
			>
				<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
					<div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
						<h1 className="text-xl font-semibold">Penjadwalan</h1>
					</div>

					<TambahJadwalKelas />
				</div>

				<div className="mt-4 h-full flex-1">
					<ScheduleGrid />

					<EditJadwalKelas />
					<DeleteConfirmationDialog
						isOpen={deleteJadwalDialogOpen}
						onOpenChange={setDeleteJadwalDialogOpen}
						title="Hapus Jadwal Kelas"
						description={
							<>
								Yakin ingin menghapus Jadwal Kelas{" "}
								<span className="text-accent font-bold">
									{selectedJadwalToDelete?.deskripsi}
								</span>
								? Tindakan ini tidak dapat dibatalkan.
							</>
						}
						onConfirm={handleConfirmDeleteJadwal}
						isLoading={jadwalMutation.delete.isPending}
						confirmText="Hapus"
						cancelText="Batal"
					/>
				</div>
			</TabsContent>

			<TabsContent value="jadwalTable" className="mt-4">
				<JadwalTableView />
			</TabsContent>
		</Tabs>
	);
}
