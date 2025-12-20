"use client";

import { StatusPembayaran } from "@prisma/client";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { FileSpreadsheet, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/_components/shared/data-table";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useKelas } from "@/hooks/useKelas";
import { usePembayaran } from "@/hooks/usePembayaran";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { usePembayaranStore } from "@/store/usePembayaranStore";
import type {
	TypePembayaran,
	TypePembayaranPaginated,
} from "@/types/pembayaran.type";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { downloadExcel } from "@/utils/exportUtils";
import { toRupiah } from "@/utils/toRupiah";
import { columns } from "./columns/columns-pembayaran";
import EditPembayaran from "./edit-pembayaran";
import TambahPembayaran from "./tambah-pembayaran";

interface PembayaranClientProps {
	initialDataPembayaran?: TypePembayaranPaginated;
}
export default function PembayaranClient({
	initialDataPembayaran,
}: PembayaranClientProps) {
	// --- STATE ---
	const { activeCabangId } = useGlobalCabangStore();
	const [statusFilter, setStatusFilter] = useState<StatusPembayaran | "ALL">(
		"ALL",
	);
	const [kelasIdFilter, setKelasIdFilter] = useState<string | "ALL">("ALL");
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([]);

	const { openDrawer } = usePembayaranStore();

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setPagination((prev) => ({ ...prev, pageIndex: 0 }));
		}, 500);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// State Delete
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<TypePembayaran | null>(null);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	// --- HOOKS/QUERIES/MUTATIONS ---
	const {
		dataGetAllPaginated: dataPembayaran,
		pageCount,
		isLoadingGetAllPaginated: isLoading,
		isFetchingGetAllPaginated: isFetching,
		refetchGetAllPaginated: refetch,
		isFetchingGetAllPaginated: isRefetching,
		mutations,
		fetchExportData,
	} = usePembayaran({
		initialDataPaginated: initialDataPembayaran,
		statusFilter: statusFilter,
		searchFilter: debouncedSearch,
		kelasIdFilter: kelasIdFilter,
		enableGetAll: true,
		pagination: pagination,
		sorting: sorting,
		filterCabang: activeCabangId,
		onSuccessDelete: () => {
			setDeleteDialogOpen(false);
			setItemToDelete(null);
		},
	});

	const { dataKelasAktif: kelasList } = useKelas({
		filterCabang: activeCabangId,
		enableQueryGetKelasAktif: true,
	});

	// --- HANDLERS ---
	const handleDeleteClick = (item: TypePembayaran) => {
		setItemToDelete(item);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		if (itemToDelete) {
			mutations.delete.mutate({ id: itemToDelete.id });
		}
	};

	const handleVerifyClick = (item: TypePembayaran) => {
		// Toggle status: Jika LUNAS -> BELUM_LUNAS, jika BELUM -> LUNAS
		const newStatus =
			item.statusBayar === StatusPembayaran.LUNAS
				? StatusPembayaran.BELUM_LUNAS
				: StatusPembayaran.LUNAS;

		mutations.update.mutate({
			id: item.id,
			jumlahBayar: item.jumlahBayar, // Required by schema
			note: item.note ?? undefined, // Optional in schema
			statusBayar: newStatus,
			tanggalBayar:
				newStatus === StatusPembayaran.LUNAS
					? new Date().toISOString()
					: undefined,
		});
	};

	const handleEditClick = (item: TypePembayaran) => {
		openDrawer("edit", item);
	};

	const handleExport = async () => {
		const toastId = toast.loading("Sedang mengunduh data...");
		try {
			// 1. Panggil fungsi dari hook (tanpa perlu passing filter lagi!)
			const rawData = await fetchExportData();

			// 2. Format Data (Flattening)
			const formattedData = rawData.map((item) => ({
				"Nama Murid": item.pendaftaranKelas.murid.namaLengkap,
				Kelas: item.pendaftaranKelas.Kelas.kodeKelas,
				Cabang: item.pendaftaranKelas.Kelas.cabang.namaCabang,
				"Pembayaran Ke": item.pembayaranKe,
				"Jumlah (Rp)": item.jumlahBayar,
				Status: item.statusBayar === "LUNAS" ? "Lunas" : "Belum Lunas",
				"Jatuh Tempo": formatDateToYYYYMMDD(item.tanggalJatuhTempo),
				"Tanggal Bayar": item.tanggalBayar
					? formatDateToYYYYMMDD(item.tanggalBayar)
					: "-",
				"Diverifikasi Oleh": item.verifiedBy?.name ?? "-",
				Catatan: item.note ?? "-",
			}));

			// 3. Download CSV
			downloadExcel(
				formattedData,
				`Laporan-Pembayaran-${new Date().toISOString().split("T")[0]}`,
			);

			toast.success("Export berhasil!", { id: toastId });
		} catch (error) {
			toast.error("Gagal mengexport data", { id: toastId });
			console.error(error);
		}
	};
	// --- TABLE CONFIG ---
	const tableColumns = columns({
		onEditClick: handleEditClick,
		onDeleteClick: handleDeleteClick,
		onVerifyClick: handleVerifyClick,
	});

	return (
		<div className="space-y-4">
			<HeaderActionPortal>
				<div className="flex items-center gap-2">
					{/* Anda bisa taruh tombol Export di sini */}
					<Button variant="ghost" size="sm" onClick={handleExport}>
						<FileSpreadsheet className="mr-2 h-4 w-4" />
						Export Excel
					</Button>
				</div>
			</HeaderActionPortal>

			{/* --- TOOLBAR --- */}
			<div>
				<header className="flex w-full flex-col gap-4">
					<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
						<div className="flex flex-1 items-center gap-3">
							<Button
								variant="ghost"
								size="icon"
								className="h-9 w-9 shrink-0"
								onClick={() => refetch()}
								disabled={isLoading || isFetching}
								title="Refresh"
							>
								<RefreshCw
									className={`h-4 w-4 ${isLoading || isFetching ? "animate-spin" : ""}`}
								/>
							</Button>

							<div className="flex flex-col">
								<h1 className="text-xl">Data Pembayaran</h1>
								<p className="text-muted-foreground text-sm">
									halaman ini mengatur data pembayaran siswa.
								</p>
							</div>
						</div>

						{/* Action button kanan (di desktop) */}
						<TambahPembayaran />
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative w-full sm:max-w-xs">
							<Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
							<Input
								placeholder="Cari nama murid..."
								className="pl-8"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<div className="flex flex-wrap gap-2">
							<Select
								value={statusFilter}
								onValueChange={(val) =>
									setStatusFilter(val as StatusPembayaran | "ALL")
								}
							>
								<SelectTrigger className="w-full sm:w-fit sm:min-w-[150px]">
									<SelectValue placeholder="Filter Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Status</SelectItem>
									<SelectItem value={StatusPembayaran.LUNAS}>Lunas</SelectItem>
									<SelectItem value={StatusPembayaran.BELUM_LUNAS}>
										Belum Lunas
									</SelectItem>
									<SelectItem value={StatusPembayaran.PENDING}>
										Pending
									</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={kelasIdFilter}
								onValueChange={(val) => setKelasIdFilter(val as string | "ALL")}
							>
								<SelectTrigger className="w-full sm:w-fit sm:min-w-[150px]">
									<SelectValue placeholder="Filter Kelas" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Kelas</SelectItem>
									{kelasList?.map((kelas) => (
										<SelectItem key={kelas.id} value={kelas.id}>
											{kelas.kodeKelas}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</header>

				<EditPembayaran />

				{/* --- DIALOGS --- */}
				<DeleteConfirmationDialog
					isOpen={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					title="Hapus Tagihan Pembayaran"
					description={
						<>
							Apakah Anda yakin ingin menghapus tagihan untuk{" "}
							<span className="text-foreground font-bold">
								{itemToDelete?.pendaftaranKelas.murid.namaLengkap}
							</span>{" "}
							sebesar{" "}
							<span className="text-foreground font-bold">
								{toRupiah(itemToDelete?.jumlahBayar ?? 0)}
							</span>
							? Data ini tidak dapat dikembalikan dan dapat mempengaruhi saldo
							pertemuan siswa.
						</>
					}
					onConfirm={handleConfirmDelete}
					isLoading={mutations.delete.isPending}
					confirmText="Hapus Tagihan"
					cancelText="Batal"
				/>

				{/* --- DATA TABLE --- */}
				<DataTable
					columns={tableColumns}
					data={dataPembayaran ?? []}
					pageCount={pageCount}
					pagination={pagination}
					onPaginationChange={setPagination}
					isLoading={isLoading || isFetching || isRefetching}
					sorting={sorting}
					onSortingChange={setSorting}
				/>
			</div>
		</div>
	);
}
