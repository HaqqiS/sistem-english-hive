"use client";

import { useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useJadwalKelasStore } from "@/store/useJadwalKelasStore";
import EditJadwalKelas from "../jadwal/edit-jadwal";
import ScheduleGrid from "../jadwal/schedule-view/schedule-grid";
import TambahJadwalKelas from "../jadwal/tambah-jadwal";
import { columns as jadwalColumns } from "./columns/columns-jadwal";
import KelasTab from "./tabs/kelas-tab";

export default function KelasClient() {
	const { activeCabangId } = useGlobalCabangStore();
	const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

	const [deleteJadwalDialogOpen, setDeleteJadwalDialogOpen] = useState(false);
	const [selectedJadwalToDelete, setSelectedJadwalToDelete] = useState<{
		id: string;
		deskripsi: string;
	} | null>(null);

	const { openDrawer } = useJadwalKelasStore();

	const { dataJadwal, mutations: jadwalMutation } = useJadwalKelas({
		enableQueryAll: true,
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

	const columnsJadwalTabel = jadwalColumns({
		onEditClick: (item) => {
			console.log("edit jadwal: ", item);
			openDrawer("edit", item);
		},
		onDeleteClick: (id, deskripsi) => {
			setSelectedJadwalToDelete({ id, deskripsi });
			setDeleteJadwalDialogOpen(true);
		},
	});

	return (
		<Tabs defaultValue="listKelas">
			<TabsList>
				<TabsTrigger value="listKelas">List Kelas</TabsTrigger>
				<TabsTrigger value="penjadwalanKelas">Penjadwalan Kelas</TabsTrigger>
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
						{/* Toggle View Mode (Opsional) */}
						<div className="bg-muted/20 flex items-center rounded-md border p-1">
							<Button
								onClick={() => setViewMode("GRID")}
								className={`rounded-sm px-3 py-1 text-xs transition-all ${viewMode === "GRID" ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
							>
								Kalender
							</Button>
							<Button
								onClick={() => setViewMode("TABLE")}
								className={`rounded-sm px-3 py-1 text-xs transition-all ${viewMode === "TABLE" ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
							>
								Tabel
							</Button>
						</div>
					</div>

					<TambahJadwalKelas />
				</div>

				<div className="mt-4 h-full flex-1">
					{/* KONTEN UTAMA */}
					{viewMode === "GRID" ? (
						<ScheduleGrid />
					) : (
						/* --- FALLBACK VIEW: TABLE --- */
						<div>
							<DataTable columns={columnsJadwalTabel} data={dataJadwal ?? []} />

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
					)}
				</div>
			</TabsContent>
		</Tabs>
	);
}
