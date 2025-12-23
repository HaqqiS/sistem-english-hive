"use client";

import { useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { useJenisKelasStore } from "@/store/useMasterDataStore";
import type { TypeJenisKelas } from "@/types/jenisKelas.type";
import { EditJenisKelas } from "./edit-jenis-kelas";
import { jenisKelasColumns } from "./jenis-kelas-columns";
import { TambahJenisKelas } from "./tambah-jenis-kelas";

export default function JenisKelasClient() {
	const { data, isLoading } = useJenisKelas();
	const { openDrawer } = useJenisKelasStore();
	const { mutations } = useJenisKelas();

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<TypeJenisKelas | null>(null);

	const handleEdit = (item: TypeJenisKelas) => {
		openDrawer("edit", item);
	};

	const handleDelete = (item: TypeJenisKelas) => {
		setItemToDelete(item);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (itemToDelete?.id) {
			await mutations.delete.mutateAsync({ id: itemToDelete.id });
			setDeleteDialogOpen(false);
			setItemToDelete(null);
		}
	};

	const columns = jenisKelasColumns({
		onEdit: handleEdit,
		onDelete: handleDelete,
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl">List Ruang</h1>
					<p className="text-muted-foreground text-sm">
						halaman ini mengatur data ruang.
					</p>
				</div>
				<TambahJenisKelas />
			</div>

			<DataTable columns={columns} data={data ?? []} isLoading={isLoading} />

			<EditJenisKelas />

			<DeleteConfirmationDialog
				isOpen={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Hapus Jenis Kelas"
				description={`Apakah Anda yakin ingin menghapus "${itemToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
				onConfirm={confirmDelete}
				isLoading={mutations.delete.isPending}
			/>
		</div>
	);
}
