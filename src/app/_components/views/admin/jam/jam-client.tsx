"use client";

import { useState } from "react";
import { DataTable as DataTableGeneric } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { columns as createJamTetapColumns } from "./jam-tetap-columns";
import { columns as createJamCustomColumns } from "./jam-custom-columns";
import {
	useJamCustomStore,
	useJamTetapStore,
} from "@/store/useMasterDataStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TypeJamTetap, TypeJamCustom } from "@/types/jam.type";
import { useJam } from "@/hooks/useJam";
import TambahJamTetap from "./tambah-jam-tetap";
import EditJamTetap from "./edit-jam-tetap";
import TambahJamCustom from "./tambah-jam-custom";
import EditJamCustom from "./edit-jam-custom";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";

export default function JamClient() {
	// State management
	const { activeCabangId } = useGlobalCabangStore();

	const { openDrawer: openJamTetapDrawer } = useJamTetapStore();
	const { openDrawer: openJamCustomDrawer } = useJamCustomStore();

	const [deleteJamTetapDialogOpen, setDeleteJamTetapDialogOpen] =
		useState(false);
	const [selectedJamTetapToDelete, setSelectedJamTetapToDelete] =
		useState<TypeJamTetap | null>(null);

	const [deleteJamCustomDialogOpen, setDeleteJamCustomDialogOpen] =
		useState(false);
	const [selectedJamCustomToDelete, setSelectedJamCustomToDelete] =
		useState<TypeJamCustom | null>(null);

	const { dataJamTetap, tetapMutations } = useJam({
		filterCabang: activeCabangId,
		// initialDataJamTetap,
		onSuccessDelete: () => {
			setDeleteJamTetapDialogOpen(false);
			setSelectedJamTetapToDelete(null);
		},
	});

	const { dataJamCustom, customMutations } = useJam({
		filterCabang: activeCabangId,
		// initialDataJamCustom,
		onSuccessDelete: () => {
			setDeleteJamCustomDialogOpen(false);
			setSelectedJamCustomToDelete(null);
		},
	});

	// Event handlers

	const handleEditClickJamTetap = (item: TypeJamTetap) => {
		openJamTetapDrawer("edit", item);
		console.log(item);
	};

	const handleEditClickJamCustom = (item: TypeJamCustom) => {
		openJamCustomDrawer("edit", item);
		console.log(item);
	};

	const handleDeleteClickJamTetap = (id: string) => {
		const jam = dataJamTetap?.find((j) => j.id === id);
		if (jam) {
			setSelectedJamTetapToDelete(jam);
			setDeleteJamTetapDialogOpen(true);
		}
	};

	const handleDeleteClickJamCustom = (id: string) => {
		const jam = dataJamCustom?.find((j) => j.id === id);
		if (jam) {
			setSelectedJamCustomToDelete(jam);
			setDeleteJamCustomDialogOpen(true);
		}
	};

	const handleConfirmDeleteJamTetap = async () => {
		if (!selectedJamTetapToDelete) return;

		await tetapMutations.delete.mutateAsync({
			id: selectedJamTetapToDelete.id,
		});
	};
	const handleConfirmDeleteJamCustom = async () => {
		if (!selectedJamCustomToDelete) return;

		await customMutations.delete.mutateAsync({
			id: selectedJamCustomToDelete.id,
		});
	};

	// Create columns with handlers
	const columnsJamTetap = createJamTetapColumns({
		onEditClick: handleEditClickJamTetap,
		onDeleteClick: handleDeleteClickJamTetap,
	});
	const columnsJamCustom = createJamCustomColumns({
		onEditClick: handleEditClickJamCustom,
		onDeleteClick: handleDeleteClickJamCustom,
	});

	return (
		<Tabs defaultValue="jamReg">
			<TabsList>
				<TabsTrigger value="jamReg">Kelola Jam Reguler</TabsTrigger>
				<TabsTrigger value="jamPriv">Kelola Jam Private</TabsTrigger>
			</TabsList>

			<TabsContent value="jamReg">
				<div>
					<div className="flex items-center justify-between space-x-2 pt-4">
						<header className="flex items-center justify-between">
							<div>
								<h1 className="text-xl">List Jam Pertemuan Reguler</h1>
								<p className="text-muted-foreground text-sm">
									halaman ini mengatur data waktu pertemuan.
								</p>
							</div>
						</header>

						<TambahJamTetap />
						<EditJamTetap />
						<DeleteConfirmationDialog
							isOpen={deleteJamTetapDialogOpen}
							onOpenChange={setDeleteJamTetapDialogOpen}
							title="Hapus Jam"
							description={
								<>
									Yakin ingin menghapus{" "}
									<span className="text-accent font-bold">
										{selectedJamTetapToDelete?.namaSlot}
									</span>
									? Tindakan ini tidak dapat dibatalkan.
								</>
							}
							onConfirm={handleConfirmDeleteJamTetap}
							isLoading={tetapMutations.delete.isPending}
							confirmText="Hapus"
							cancelText="Batal"
						/>
					</div>

					<DataTableGeneric
						data={dataJamTetap ?? []}
						columns={columnsJamTetap}
					/>
				</div>
			</TabsContent>

			<TabsContent value="jamPriv">
				<div>
					<div className="flex items-center justify-between space-x-2 pt-4">
						<header className="flex items-center justify-between">
							<div>
								<h1 className="text-xl">List Jam Pertemuan Private</h1>
								<p className="text-muted-foreground text-sm">
									halaman ini mengatur data waktu pertemuan.
								</p>
							</div>
						</header>

						<TambahJamCustom />
						<EditJamCustom />
						<DeleteConfirmationDialog
							isOpen={deleteJamCustomDialogOpen}
							onOpenChange={setDeleteJamCustomDialogOpen}
							title="Hapus Jam"
							description={
								<>
									Yakin ingin menghapus
									<span className="text-accent font-bold"></span>? Tindakan ini
									tidak dapat dibatalkan.
								</>
							}
							onConfirm={handleConfirmDeleteJamCustom}
							isLoading={customMutations.delete.isPending}
							confirmText="Hapus"
							cancelText="Batal"
						/>
					</div>

					<DataTableGeneric
						data={dataJamCustom ?? []}
						columns={columnsJamCustom}
					/>
				</div>
			</TabsContent>
		</Tabs>
	);
}
