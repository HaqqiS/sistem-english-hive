"use client";

import { Edit } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import {
	useGuruKelasStore,
	usePendaftaranKelasStore,
} from "@/store/useKelasStore";

import { columns as guru } from "./columns/columns-list-guru";
import { columns as murid } from "./columns/columns-list-murid";
import { BulkActivateDialog } from "./detailKelas/bulk-activate-dialog";
import EditGuruKelas from "./drawers/edit-guru-kelas";
import EditMuridDetailKelas from "./drawers/edit-murid";
import TambahGuruKelas from "./drawers/tambah-guru-kelas";
import TambahMuridDetailKelas from "./drawers/tambah-murid";

interface KelolaKelasSheetProps {
	kelasId: string | null;
	kodeKelas?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function KelolaKelasSheet({
	kelasId,
	kodeKelas,
	open,
	onOpenChange,
}: KelolaKelasSheetProps) {
	const [
		deletePendaftaranKelasDialogOpen,
		setDeletePendaftaranKelasDialogOpen,
	] = useState(false);
	const [
		selectedPendaftaranKelasToDelete,
		setSelectedPendaftaranKelasToDelete,
	] = useState<{ id: string; namaMurid: string } | null>(null);

	const [
		deleteHistoryGuruKelasDialogOpen,
		setDeleteHistoryGuruKelasDialogOpen,
	] = useState(false);
	const [
		selectedHistoryGuruKelasToDelete,
		setSelectedHistoryGuruKelasToDelete,
	] = useState<{ id: string; namaGuru: string } | null>(null);

	const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
	const [selectedGuruToToggle, setSelectedGuruToToggle] = useState<{
		id: string;
		namaGuru: string;
		currentStatus: "ACTIVE" | "INACTIVE";
	} | null>(null);

	const { openDrawer: openGuruDrawer } = useGuruKelasStore();
	const { openDrawer: openPendaftaranDrawer } = usePendaftaranKelasStore();

	// HOOKS/QUERIES & MUTATIONS — hanya jalan kalau kelasId ada & sheet terbuka
	const { dataByKelasId, isLoadingByKelasId, mutations: pendaftaranKelasMutations } =
		usePendaftaranKelas({
			enableQuery: open && !!kelasId,
			kelasId: kelasId ?? undefined,
			onSuccessDelete() {
				setDeletePendaftaranKelasDialogOpen(false);
				setSelectedPendaftaranKelasToDelete(null);
			},
		});

	const {
		dataById: dataGuruByKelasId,
		isLoadingById: loadingGuru,
		mutations: historyGuruKelasMutations,
	} = UseHistoryGuruKelas({
		kelasId: kelasId ?? undefined,
		enableQuery: open && !!kelasId,
		onSuccessDelete() {
			setDeleteHistoryGuruKelasDialogOpen(false);
			setSelectedHistoryGuruKelasToDelete(null);
		},
	});

	const activeGuruHistories = useMemo(
		() => dataGuruByKelasId?.filter((h) => h.statusGuru === "ACTIVE") ?? [],
		[dataGuruByKelasId],
	);

	const handleOpenEditDrawer = () => {
		const guruToEdit = activeGuruHistories[0];
		if (activeGuruHistories.length === 1 && guruToEdit) {
			openGuruDrawer("edit", guruToEdit);
		}
	};

	const handleToggleStatus = (
		id: string,
		currentStatus: "ACTIVE" | "INACTIVE",
		namaGuru: string,
	) => {
		setSelectedGuruToToggle({ id, namaGuru, currentStatus });
		setToggleStatusDialogOpen(true);
	};

	const handleConfirmToggleStatus = () => {
		if (!selectedGuruToToggle) return;
		const newStatus =
			selectedGuruToToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

		historyGuruKelasMutations.toggleStatus.mutate(
			{ id: selectedGuruToToggle.id, status: newStatus },
			{
				onSuccess: () => {
					setToggleStatusDialogOpen(false);
					setSelectedGuruToToggle(null);
				},
			},
		);
	};

	const handleConfirmDeletePendaftaranKelas = () => {
		if (!selectedPendaftaranKelasToDelete) return;
		pendaftaranKelasMutations.delete.mutate({
			id: selectedPendaftaranKelasToDelete.id,
		});
	};

	const handleConfirmDeleteGuruKelas = () => {
		if (!selectedHistoryGuruKelasToDelete || !kelasId) return;
		historyGuruKelasMutations.delete.mutate({
			id: selectedHistoryGuruKelasToDelete.id,
			kelasId,
		});
	};

	const columnsMurid = murid({
		onEditClick: (item) => openPendaftaranDrawer("edit", item),
		onDeleteClick: (id, namaLengkap) => {
			setSelectedPendaftaranKelasToDelete({ id, namaMurid: namaLengkap });
			setDeletePendaftaranKelasDialogOpen(true);
		},
	});

	const columnsGuru = guru({
		onEditClick: (item) => openGuruDrawer("edit", item),
		onDeleteClick: (id, namaGuru) => {
			setSelectedHistoryGuruKelasToDelete({ id, namaGuru });
			setDeleteHistoryGuruKelasDialogOpen(true);
		},
		onToggleStatus: handleToggleStatus,
	});

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					side="right"
					className="w-full overflow-y-auto sm:max-w-2xl"
				>
					<SheetHeader>
						<SheetTitle>Kelola Kelas {kodeKelas ? `· ${kodeKelas}` : ""}</SheetTitle>
						<SheetDescription>
							Tambah, edit, atau hapus murid & guru tanpa pindah halaman.
						</SheetDescription>
					</SheetHeader>

					<div className="px-4 pb-6">
						<Tabs defaultValue="murid">
							<TabsList className="w-full">
								<TabsTrigger value="murid" className="flex-1">
									Murid
								</TabsTrigger>
								<TabsTrigger value="guru" className="flex-1">
									Guru
								</TabsTrigger>
							</TabsList>

							{/* TAB MURID */}
							<TabsContent value="murid" className="space-y-4 pt-4">
								<div className="flex items-center justify-end gap-2">
									{kelasId && <TambahMuridDetailKelas kelasId={kelasId} />}
									<EditMuridDetailKelas />
								</div>
								<DataTable
									data={dataByKelasId ?? []}
									columns={columnsMurid}
									isLoading={isLoadingByKelasId}
									toolbar={(table) => {
										const selectedRows =
											table.getFilteredSelectedRowModel().rows;
										if (selectedRows.length === 0) return null;
										const selectedIds = selectedRows.map(
											(row) => row.original.id,
										);
										return (
											<div className="flex items-center gap-2">
												<BulkActivateDialog
													selectedIds={selectedIds}
													onSuccess={() => table.resetRowSelection()}
												/>
												<p className="text-muted-foreground text-sm">
													{selectedRows.length} siswa terpilih
												</p>
											</div>
										);
									}}
								/>
							</TabsContent>

							{/* TAB GURU */}
							<TabsContent value="guru" className="space-y-4 pt-4">
								<div className="flex items-center justify-end gap-2">
									<EditGuruKelas />
									{loadingGuru ? (
										<Skeleton className="h-9 w-32 rounded-md" />
									) : (
										<>
											{activeGuruHistories.length === 1 && (
												<Button
													variant="outline"
													size="sm"
													onClick={handleOpenEditDrawer}
												>
													<Edit className="mr-2 h-4 w-4" />
													Edit Guru Aktif
												</Button>
											)}
											{kelasId && <TambahGuruKelas kelasId={kelasId} />}
										</>
									)}
								</div>
								<DataTable
									data={dataGuruByKelasId ?? []}
									columns={columnsGuru}
									isLoading={loadingGuru}
								/>
							</TabsContent>
						</Tabs>
					</div>
				</SheetContent>
			</Sheet>

			{/* Konfirmasi hapus murid */}
			<DeleteConfirmationDialog
				isOpen={deletePendaftaranKelasDialogOpen}
				onOpenChange={setDeletePendaftaranKelasDialogOpen}
				title="Hapus Murid dari Kelas"
				description={
					<>
						Yakin ingin menghapus murid{" "}
						<span className="text-accent font-bold">
							{selectedPendaftaranKelasToDelete?.namaMurid}
						</span>{" "}
						dari kelas ? Tindakan ini tidak dapat dibatalkan.
					</>
				}
				onConfirm={handleConfirmDeletePendaftaranKelas}
				isLoading={pendaftaranKelasMutations.delete.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>

			{/* Konfirmasi hapus history guru */}
			<DeleteConfirmationDialog
				isOpen={deleteHistoryGuruKelasDialogOpen}
				onOpenChange={setDeleteHistoryGuruKelasDialogOpen}
				title="Hapus History Guru Kelas"
				description={
					<>
						Yakin ingin menghapus History Guru{" "}
						<span className="text-accent font-bold">
							{selectedHistoryGuruKelasToDelete?.namaGuru}
						</span>{" "}
						dari kelas ? Tindakan ini tidak dapat dibatalkan.
					</>
				}
				onConfirm={handleConfirmDeleteGuruKelas}
				isLoading={historyGuruKelasMutations.delete.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>

			{/* Konfirmasi toggle status guru */}
			<AlertDialog
				open={toggleStatusDialogOpen}
				onOpenChange={setToggleStatusDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin mengubah status{" "}
							<span className="text-foreground font-bold">
								{selectedGuruToToggle?.namaGuru}
							</span>{" "}
							menjadi{" "}
							<span className="text-foreground font-bold">
								{selectedGuruToToggle?.currentStatus === "ACTIVE"
									? "Tidak Aktif"
									: "Aktif"}
							</span>
							?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleConfirmToggleStatus();
							}}
							className={
								selectedGuruToToggle?.currentStatus === "ACTIVE"
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
									: ""
							}
							disabled={historyGuruKelasMutations.toggleStatus.isPending}
						>
							{historyGuruKelasMutations.toggleStatus.isPending
								? "Memproses..."
								: "Ya, Ubah Status"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}