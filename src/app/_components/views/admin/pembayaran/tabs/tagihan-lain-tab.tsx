"use client";

import { KategoriTagihan, StatusPembayaran } from "@prisma/client";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/_components/shared/data-table";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Button } from "@/components/ui/button";
import { useTagihanLain } from "@/hooks/useTagihanLain";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { downloadExcel } from "@/utils/exportUtils";
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
		pageSize: 50,
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
		fetchExportData,
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

	const handleExport = async () => {
		const toastId = toast.loading("Sedang mengunduh data...");
		try {
			const rawData = await fetchExportData(kategori);

			const formattedData = rawData.map((item) => ({
				"Nama Murid": item.murid.namaLengkap,
				"No WA": item.murid.noWA ?? "-",
				Cabang: item.murid.cabang.namaCabang,
				Kelas: item.kelas?.kodeKelas ?? "-",
				Judul: item.judul,
				Kategori: item.kategori,
				"Jumlah (Rp)": item.jumlah,
				Status: item.status,
				"Dibuat Pada": formatDateToYYYYMMDD(item.createdAt),
				Deskripsi: item.deskripsi ?? "-",
			}));

			const filename = `Laporan-${kategori === "BUKU" ? "Buku" : kategori === "REGISTRASI" ? "Registrasi" : "TagihanLain"}-${new Date().toISOString().split("T")[0]}`;

			downloadExcel(formattedData, filename);

			toast.success("Export berhasil!", { id: toastId });
		} catch (error) {
			toast.error("Gagal mengexport data", { id: toastId });
			console.error(error);
		}
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

			<HeaderActionPortal>
				<Button variant="ghost" size="sm" onClick={handleExport}>
					<FileSpreadsheet className="mr-2 h-4 w-4" />
					Export Excel
				</Button>
			</HeaderActionPortal>

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
