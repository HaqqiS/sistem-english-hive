"use client";

import { StatusPembayaran } from "@prisma/client";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { FileSpreadsheet, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/_components/shared/data-table";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import CardJatuhTempo from "@/app/_components/views/admin/pembayaran/card-jatuh-tempo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKelas } from "@/hooks/useKelas";
import { usePembayaran } from "@/hooks/usePembayaran";
import { useTagihanLain } from "@/hooks/useTagihanLain";
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
import {
	columnsTagihanLainGlobal,
	type TypeTagihanLain,
} from "./columns/columns-tagihan-lain";
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

	// --- TAGIHAN LAIN HOOK ---
	const [tagihanLainPagination, setTagihanLainPagination] =
		useState<PaginationState>({
			pageIndex: 0,
			pageSize: 10,
		});
	const [tagihanLainSorting, setTagihanLainSorting] = useState<SortingState>(
		[],
	);
	const [deleteTagihanLainOpen, setDeleteTagihanLainOpen] = useState(false);
	const [tagihanLainToDelete, setTagihanLainToDelete] =
		useState<TypeTagihanLain | null>(null);

	const {
		dataGetAllPaginated: dataTagihanLain,
		pageCount: pageCountTagihanLain,
		isLoadingGetAllPaginated: isLoadingTagihanLain,
		refetchGetAllPaginated: refetchTagihanLain,
		mutations: mutationsTagihanLain,
	} = useTagihanLain({
		pagination: tagihanLainPagination,
		filterCabang: activeCabangId,
		filterStatus: statusFilter === "ALL" ? undefined : statusFilter,
		searchQuery: debouncedSearch,
		enableGetAll: true,
		onSuccessDelete: () => {
			setDeleteTagihanLainOpen(false);
			setTagihanLainToDelete(null);
		},
	});

	console.log(dataTagihanLain);

	// --- HANDLERS TAGIHAN LAIN ---
	const handleDeleteTagihanLainClick = (item: TypeTagihanLain) => {
		setTagihanLainToDelete(item);
		setDeleteTagihanLainOpen(true);
	};

	const handleConfirmDeleteTagihanLain = () => {
		if (tagihanLainToDelete) {
			mutationsTagihanLain.delete.mutate({ id: tagihanLainToDelete.id });
		}
	};

	const handleVerifyTagihanLain = (item: TypeTagihanLain) => {
		if (item.status === StatusPembayaran.LUNAS) {
			mutationsTagihanLain.update.mutate({
				id: item.id,
				status: StatusPembayaran.BELUM_LUNAS,
			});
		} else {
			mutationsTagihanLain.markAsPaid.mutate({ id: item.id });
		}
	};

	const handleEditTagihanLain = (_item: TypeTagihanLain) => {
		// Untuk fitur edit di admin global view, kita perlu Drawer/Modal yang support pengeditan
		// Kita bisa reuse component EditTagihanLain yang sudah ada, tapi perlu state untuk membuka modal tsb.
		// Karena logicnya sama dengan di history murid, kita tambahkan state ini.
		// Note: Di request awal item ini belum diminta detailnya, tapi best practice sudah ada.
		// Saya akan tambahkan log warning jika belum implemented atau reuse edit drawer jika ada.
		toast("Fitur Edit Tagihan Lain dari Global View belum diimplementasikan", {
			description: "Silakan edit melalui detail siswa",
		});
	};

	const tableColumnsTagihanLain = columnsTagihanLainGlobal({
		onDeleteClick: handleDeleteTagihanLainClick,
		onEditClick: handleEditTagihanLain,
		onVerifyClick: handleVerifyTagihanLain,
	});

	return (
		<div className="space-y-4">
			<Tabs defaultValue="list" className="w-full">
				<div className="flex items-center justify-between">
					<TabsList>
						<TabsTrigger value="list">SPP (Tuition)</TabsTrigger>
						<TabsTrigger value="tagihan-lain">Tagihan Lain</TabsTrigger>
						<TabsTrigger value="jatuh-tempo">Jatuh Tempo</TabsTrigger>
					</TabsList>

					<HeaderActionPortal>
						<div className="flex items-center gap-2">
							{/* Anda bisa taruh tombol Export di sini */}
							<Button variant="ghost" size="sm" onClick={handleExport}>
								<FileSpreadsheet className="mr-2 h-4 w-4" />
								Export Excel
							</Button>
						</div>
					</HeaderActionPortal>
				</div>

				{/* Shared Filters Header - Consider moving inside TabsContent if filters differ significantly, 
            but for now they share SEARCH and STATUS filters. KELAS filter applies to SPP usually. */}
				<div className="mt-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
					<div className="flex flex-1 items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 shrink-0"
							onClick={() => {
								refetch(); // Refetch SPP
								refetchTagihanLain(); // Refetch Tagihan Lain
							}}
							disabled={isLoading || isFetching || isLoadingTagihanLain}
							title="Refresh"
						>
							<RefreshCw
								className={`h-4 w-4 ${isLoading || isFetching || isLoadingTagihanLain ? "animate-spin" : ""}`}
							/>
						</Button>
						<div className="flex flex-col">
							<h1 className="text-xl">Data Pembayaran</h1>
							<p className="text-muted-foreground text-sm">
								Monitor pembayaran SPP dan Tagihan Lainnya.
							</p>
						</div>
					</div>
					<TambahPembayaran />
				</div>

				<div className="my-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
								<SelectValue placeholder="Filter Kelas (SPP Only)" />
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

				<TabsContent value="list" className="space-y-4">
					<EditPembayaran />

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
								? Data ini tidak dapat dikembalikan.
							</>
						}
						onConfirm={handleConfirmDelete}
						isLoading={mutations.delete.isPending}
						confirmText="Hapus Tagihan"
						cancelText="Batal"
					/>

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
				</TabsContent>

				<TabsContent value="tagihan-lain" className="space-y-4">
					<DeleteConfirmationDialog
						isOpen={deleteTagihanLainOpen}
						onOpenChange={setDeleteTagihanLainOpen}
						title="Hapus Tagihan Lain"
						description={
							<>
								Apakah Anda yakin ingin menghapus tagihan{" "}
								<b>{tagihanLainToDelete?.judul}</b> senilai{" "}
								<b>{toRupiah(tagihanLainToDelete?.jumlah ?? 0)}</b>?
							</>
						}
						onConfirm={handleConfirmDeleteTagihanLain}
						isLoading={mutationsTagihanLain.delete.isPending}
						confirmText="Hapus Tagihan"
						cancelText="Batal"
					/>

					<DataTable
						columns={tableColumnsTagihanLain}
						data={dataTagihanLain}
						pageCount={pageCountTagihanLain}
						pagination={tagihanLainPagination}
						onPaginationChange={setTagihanLainPagination}
						isLoading={isLoadingTagihanLain}
						sorting={tagihanLainSorting}
						onSortingChange={setTagihanLainSorting}
					/>
				</TabsContent>

				<TabsContent value="jatuh-tempo">
					<CardJatuhTempo className="w-full border-0 shadow-none" />
				</TabsContent>
			</Tabs>
		</div>
	);
}
