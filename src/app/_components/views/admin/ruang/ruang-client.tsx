"use client";

import { useState } from "react";
import { DataTable as DataTableGeneric } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { columns as createRuangColumns } from "./ruang-columns";
import TambahRuang from "./tambah-ruang";
import { useRuangStore } from "@/store/useMasterDataStore";
import type { RuangType } from "@/types/ruang.type";
import EditRuang from "./edit-ruang";
import { useRuang } from "@/hooks/useRuang";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";

export default function RuangClient() {
	// State management
	const { activeCabangId } = useGlobalCabangStore();

	const { openDrawer: openRuangDrawer } = useRuangStore();

	const [deleteRuangDialogOpen, setDeleteRuangDialogOpen] = useState(false);
	const [selectedRuangToDelete, setSelectedRuangToDelete] =
		useState<RuangType | null>(null);

	const { data: dataRuang, mutations: ruangMutations } = useRuang({
		filterCabang: activeCabangId,
		onSuccessDelete: () => {
			setDeleteRuangDialogOpen(false);
			setSelectedRuangToDelete(null);
		},
	});

	// Event handlers

	const handleEditClickRuang = (item: RuangType) => {
		openRuangDrawer("edit", item);
	};

	const handleDeleteClickRuang = (id: string) => {
		const ruang = dataRuang?.find((r) => r.id === id);
		if (ruang) {
			setSelectedRuangToDelete(ruang);
			setDeleteRuangDialogOpen(true);
		}
	};

	const handleConfirmDeleteRuang = async () => {
		if (!selectedRuangToDelete) return;

		await ruangMutations.delete.mutateAsync({ id: selectedRuangToDelete.id });
	};

	// Create columns with handlers

	const columnsRuang = createRuangColumns({
		onEditClick: handleEditClickRuang,
		onDeleteClick: handleDeleteClickRuang,
	});

	return (
		<Tabs defaultValue="ruang">
			<TabsContent value="ruang">
				<div>
					<div className="flex items-center justify-between space-x-2 pt-4">
						<header className="flex items-center justify-between">
							<div>
								<h1 className="text-xl">List Ruang</h1>
								<p className="text-muted-foreground text-sm">
									halaman ini mengatur data ruang.
								</p>
							</div>
						</header>

						<TambahRuang />
						<EditRuang />
						<DeleteConfirmationDialog
							isOpen={deleteRuangDialogOpen}
							onOpenChange={setDeleteRuangDialogOpen}
							title="Hapus Ruang"
							description={
								<>
									Yakin ingin menghapus ruang{" "}
									<span className="text-accent font-bold">
										{selectedRuangToDelete?.namaRuang}
									</span>
									? Tindakan ini tidak dapat dibatalkan.
								</>
							}
							onConfirm={handleConfirmDeleteRuang}
							isLoading={ruangMutations.delete.isPending}
							confirmText="Hapus"
							cancelText="Batal"
						/>
					</div>

					<DataTableGeneric
						// filterColumnId="namaRuang"
						// filterColumnPlaceholder="Filter Nama Ruang..."
						columns={columnsRuang}
						data={dataRuang ?? []}
						// toolbar={(table) => (
						//   <div className="flex items-center gap-2">
						//     {/* <Select
						//   onValueChange={(value) =>
						//     table.getColumn("cabangId")?.setFilterValue(value)
						//   }
						// >
						//   <SelectTrigger className="w-[180px]">
						//     <SelectValue placeholder="Filter by Cabang" />
						//   </SelectTrigger>
						//   <SelectContent>
						//     <SelectItem value="all">All</SelectItem>
						//     {dataCabang?.map((cabang) => {
						//       return (
						//         <SelectItem key={cabang.id} value={cabang.id}>
						//           {cabang.namaCabang}
						//         </SelectItem>
						//       );
						//     })}
						//   </SelectContent>
						// </Select> */}
						//   </div>
						// )}
					/>
				</div>
			</TabsContent>
		</Tabs>
	);
}
