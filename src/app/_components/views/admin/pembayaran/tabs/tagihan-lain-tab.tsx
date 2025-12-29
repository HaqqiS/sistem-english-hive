"use client";

import { KategoriTagihan, StatusPembayaran } from "@prisma/client";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { useTagihanLain } from "@/hooks/useTagihanLain";
import { toRupiah } from "@/utils/toRupiah";
import {
	columnsTagihanLainGlobal,
	type TypeTagihanLain,
} from "../columns/columns-tagihan-lain";
import EditTagihanLain from "../drawer/edit-tagihan-lain";
import TambahTagihanLain from "../drawer/tambah-tagihan-lain";

interface TagihanLainTabProps {
	kategori: KategoriTagihan;
	labelTambah?: string;
	filterCabang?: string;
	filterStatus: StatusPembayaran | "ALL";
	searchQuery: string;
}

export default function TagihanLainTab({
	kategori,
	labelTambah,
	filterCabang,
	filterStatus,
	searchQuery,
}: TagihanLainTabProps) {
	// --- STATE ---
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const [sorting, setSorting] = useState<SortingState>([]);

	// Delete State
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<TypeTagihanLain | null>(
		null,
	);

	// Edit State
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [itemToEdit, setItemToEdit] = useState<TypeTagihanLain | null>(null);

	// --- HOOK ---
	const {
		// Buku
		dataGetAllBukuPaginated,
		pageCountBuku,
		isLoadingGetAllBukuPaginated,

		// Registrasi
		dataGetAllRegistrasiPaginated,
		pageCountRegistrasi,
		isLoadingGetAllRegistrasiPaginated,

		// Lainnya
		dataGetAllLainnyaPaginated,
		pageCountLainnya,
		isLoadingGetAllLainnyaPaginated,

		mutations,
	} = useTagihanLain({
		pagination,
		sorting,
		filterCabang,
		filterStatus: filterStatus === "ALL" ? undefined : filterStatus,
		filterKategori: kategori,
		searchQuery: searchQuery,
		enableGetAll: true,
		onSuccessDelete: () => {
			setDeleteDialogOpen(false);
			setItemToDelete(null);
		},
		onSuccessUpdate: () => {
			setEditDialogOpen(false);
			setItemToEdit(null);
		},
	});

	// --- SELECT DATA BASED ON KATEGORI ---
	let data: TypeTagihanLain[] = [];
	let pageCount = -1;
	let isLoading = false;

	if (kategori === KategoriTagihan.BUKU) {
		data = dataGetAllBukuPaginated;
		pageCount = pageCountBuku;
		isLoading = isLoadingGetAllBukuPaginated;
	} else if (kategori === KategoriTagihan.REGISTRASI) {
		data = dataGetAllRegistrasiPaginated;
		pageCount = pageCountRegistrasi;
		isLoading = isLoadingGetAllRegistrasiPaginated;
	} else {
		data = dataGetAllLainnyaPaginated;
		pageCount = pageCountLainnya;
		isLoading = isLoadingGetAllLainnyaPaginated;
	}

	// --- HANDLERS ---
	const handleDeleteClick = (item: TypeTagihanLain) => {
		setItemToDelete(item);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		if (itemToDelete) {
			mutations.delete.mutate({ id: itemToDelete.id });
		}
	};

	const handleVerifyClick = (item: TypeTagihanLain) => {
		if (item.status === StatusPembayaran.LUNAS) {
			mutations.update.mutate({
				id: item.id,
				status: StatusPembayaran.BELUM_LUNAS,
			});
		} else {
			mutations.markAsPaid.mutate({ id: item.id });
		}
	};

	const handleEditClick = (item: TypeTagihanLain) => {
		setItemToEdit(item);
		setEditDialogOpen(true);
	};

	const tableColumns = columnsTagihanLainGlobal({
		onDeleteClick: handleDeleteClick,
		onEditClick: handleEditClick,
		onVerifyClick: handleVerifyClick,
	});

	return (
		<div className="space-y-4">
			<EditTagihanLain
				isOpen={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				data={itemToEdit}
			/>

			<div className="flex justify-end">
				{labelTambah && (
					<TambahTagihanLain kategori={kategori} label={labelTambah} />
				)}
			</div>

			<DeleteConfirmationDialog
				isOpen={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title={`Hapus ${kategori === "BUKU" ? "Tagihan Buku" : kategori === "REGISTRASI" ? "Biaya Registrasi" : "Tagihan Lain"}`}
				description={
					<>
						Apakah Anda yakin ingin menghapus <b>{itemToDelete?.judul}</b>{" "}
						senilai <b>{toRupiah(itemToDelete?.jumlah ?? 0)}</b>?
					</>
				}
				onConfirm={handleConfirmDelete}
				isLoading={mutations.delete.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>

			<DataTable
				columns={tableColumns}
				data={data}
				pageCount={pageCount}
				pagination={pagination}
				onPaginationChange={setPagination}
				isLoading={isLoading}
				sorting={sorting}
				onSortingChange={setSorting}
			/>
		</div>
	);
}
