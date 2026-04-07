"use client";

import { KategoriTagihan, StatusPembayaran } from "@prisma/client";
import { pdf } from "@react-pdf/renderer";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { FileSpreadsheet, Filter, RefreshCw, Search } from "lucide-react";
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
import { useJenisKelas } from "@/hooks/useJenisKelas";
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
import EditPembayaran from "./drawer/edit-pembayaran";
import TambahPembayaran from "./drawer/tambah-pembayaran";
import { type ReceiptItem, ReceiptPDF } from "./receipt-pdf";
import TagihanLainTab from "./tabs/tagihan-lain-tab";

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
	const [jenisKelasFilter, setJenisKelasFilter] = useState<string | "ALL">(
		"ALL",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [levelFilter, setLevelFilter] = useState<number | "ALL">("ALL");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

	const ROW_SELECTION_KEY = "pembayaran-row-selection";

	useEffect(() => {
		const saved = sessionStorage.getItem(ROW_SELECTION_KEY);
		if (saved) {
			try {
				setRowSelection(JSON.parse(saved));
			} catch (e) {
				console.error("Gagal parsing row selection:", e);
			}
		}
	}, []);

	useEffect(() => {
		sessionStorage.setItem(ROW_SELECTION_KEY, JSON.stringify(rowSelection));
	}, [rowSelection]);

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
		pageSize: 50,
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
		levelFilter: levelFilter,
		jenisKelasFilter: jenisKelasFilter,
		onSuccessDelete: () => {
			setDeleteDialogOpen(false);
			setItemToDelete(null);
		},
	});

	const { dataKelasAktif: kelasList } = useKelas({
		filterCabang: activeCabangId,
		enableQueryGetKelasAktif: true,
	});
	const { data: jenisKelasList } = useJenisKelas({
		cabangId: activeCabangId,
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

	const handleDownloadSPP = async (item: TypePembayaran) => {
		try {
			const idToast = toast.loading("Membuat Kuitansi...");
			const kodeKls = item.pendaftaranKelas.Kelas.kodeKelas;

			const receiptItem: ReceiptItem = {
				id: item.id,
				judul: `SPP Bulan Ke-${item.pembayaranKe}`,
				kodeKelas: kodeKls,
				kategori: "SPP",
				jumlah: item.jumlahBayar,
				tanggalBayar: item.tanggalBayar,
			};

			const adminName = item.verifiedBy?.name ?? "Admin";
			const muridN = item.pendaftaranKelas.murid.namaLengkap;
			const cabangName =
				item.pendaftaranKelas.Kelas.cabang?.namaCabang ?? "Pusat";

			const doc = (
				<ReceiptPDF
					items={[receiptItem]}
					namaMurid={muridN}
					cabangName={cabangName}
					adminName={adminName}
				/>
			);

			const asPdf = pdf(doc);
			const blob = await asPdf.toBlob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `Kuitansi_SPP_${muridN}_Ke-${item.pembayaranKe}.pdf`;
			link.click();
			URL.revokeObjectURL(url);

			toast.dismiss(idToast);
			toast.success("Kuitansi berhasil diunduh");
		} catch (error) {
			console.error(error);
			toast.error("Gagal membuat kuitansi");
		}
	};
	// --- TABLE CONFIG ---
	const tableColumns = columns({
		onEditClick: handleEditClick,
		onDeleteClick: handleDeleteClick,
		onVerifyClick: handleVerifyClick,
		onDownloadClick: handleDownloadSPP,
	});

	// --- REFRESH UTILS ---
	// We use this just to expose invalidate capability for the Refresh Button
	const { invalidateAll: invalidateAllTagihan } = useTagihanLain();

	// Handlers for SPP are kept here
	// ...

	return (
		<div className="space-y-4">
			<Tabs defaultValue="list" className="w-full">
				<div className="flex items-center justify-between">
					<TabsList>
						<TabsTrigger value="list">SPP (Tuition)</TabsTrigger>
						<TabsTrigger value="tagihan-buku">Buku</TabsTrigger>
						<TabsTrigger value="fee-registration">Registration Fee</TabsTrigger>
						<TabsTrigger value="tagihan-lain">Tagihan Lainnya</TabsTrigger>
						<TabsTrigger value="jatuh-tempo">Jatuh Tempo</TabsTrigger>
					</TabsList>
				</div>

				{/* Shared Filters Header */}
				<div className="mt-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
					<div className="flex flex-1 items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 shrink-0"
							onClick={async () => {
								refetch(); // Refetch SPP (from usePembayaran)
								await invalidateAllTagihan(); // Refetch all tagihan lain
							}}
							disabled={isLoading || isFetching}
							title="Refresh"
						>
							<RefreshCw
								className={`h-4 w-4 ${
									isLoading || isFetching ? "animate-spin" : ""
								}`}
							/>
						</Button>
						<div className="flex flex-col">
							<h1 className="text-xl">Data Pembayaran</h1>
							<p className="text-muted-foreground text-sm">
								Monitor pembayaran SPP dan Tagihan Lainnya.
							</p>
						</div>
					</div>
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
					</div>
				</div>

				<TabsContent value="list" className="space-y-4">
					<HeaderActionPortal>
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" onClick={handleExport}>
								<FileSpreadsheet className="mr-2 h-4 w-4" />
								Export Excel
							</Button>
						</div>
					</HeaderActionPortal>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						{/* Filter Kelas khusus SPP */}
						<div className="flex flex-wrap items-center gap-2">
							<Select
								value={kelasIdFilter}
								onValueChange={(val) => setKelasIdFilter(val as string | "ALL")}
							>
								<SelectTrigger className="w-full sm:w-[170px]">
									<div className="flex items-center gap-2">
										<Filter className="text-muted-foreground h-4 w-4" />
										<SelectValue placeholder="Filter Kelas" />
									</div>
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

							{/* Filter Jenis Kelas untuk SPP */}
							<Select
								value={jenisKelasFilter}
								onValueChange={(v) => setJenisKelasFilter(v)}
							>
								<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[170px]">
									<div className="flex items-center gap-2">
										<Filter className="text-muted-foreground h-4 w-4" />
										<span className="font-medium">
											<SelectValue placeholder="Semua Jenis Kelas" />
										</span>
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Jenis Kelas</SelectItem>
									{jenisKelasList?.map((jk) => (
										<SelectItem key={jk.nama} value={jk.nama}>
											{jk.nama}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Filter Level untuk SPP */}
							<Select
								value={levelFilter.toString()}
								onValueChange={(v) =>
									setLevelFilter(v === "ALL" ? "ALL" : Number(v))
								}
							>
								<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[170px]">
									<div className="flex items-center gap-2">
										<Filter className="text-muted-foreground h-4 w-4" />
										<span className="font-medium">
											<SelectValue placeholder="Semua Level" />
										</span>
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Level</SelectItem>
									<SelectItem value="1">Level 1</SelectItem>
									<SelectItem value="2">Level 2</SelectItem>
									<SelectItem value="3">Level 3</SelectItem>
									<SelectItem value="4">Level 4</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<TambahPembayaran />
					</div>

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
						rowSelection={rowSelection}
						onRowSelectionChange={setRowSelection}
						getRowId={(row) => row.id}
					/>
				</TabsContent>

				<TabsContent value="tagihan-buku" className="space-y-4">
					<div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
						<div className="flex flex-wrap items-center gap-2">
							{/* Filter Kelas untuk Buku */}
							<Select
								value={kelasIdFilter}
								onValueChange={(val) => setKelasIdFilter(val as string | "ALL")}
							>
								<SelectTrigger className="w-full sm:w-[200px]">
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

							{/* Filter Jenis Kelas untuk Buku */}
							<Select
								value={jenisKelasFilter}
								onValueChange={(v) => setJenisKelasFilter(v)}
							>
								<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[170px]">
									<div className="flex items-center gap-2">
										<Filter className="text-muted-foreground h-4 w-4" />
										<span className="font-medium">
											<SelectValue placeholder="Semua Jenis Kelas" />
										</span>
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Jenis Kelas</SelectItem>
									{jenisKelasList
										?.filter(
											(jenis, index, self) =>
												index === self.findIndex((t) => t.nama === jenis.nama),
										)
										.map((jenis) => (
											<SelectItem key={jenis.nama} value={jenis.nama}>
												<div className="flex items-center gap-2">
													{jenis.nama}
												</div>
											</SelectItem>
										))}
								</SelectContent>
							</Select>

							{/* Filter Level untuk Buku */}
							<Select
								value={levelFilter.toString()}
								onValueChange={(v) =>
									setLevelFilter(v === "ALL" ? "ALL" : Number(v))
								}
							>
								<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[170px]">
									<div className="flex items-center gap-2">
										<Filter className="text-muted-foreground h-4 w-4" />
										<span className="font-medium">
											<SelectValue placeholder="Semua Level" />
										</span>
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Level Kelas</SelectItem>
									<SelectItem value="1">Level 1</SelectItem>
									<SelectItem value="2">Level 2</SelectItem>
									<SelectItem value="3">Level 3</SelectItem>
									<SelectItem value="4">Level 4</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<TagihanLainTab
						kategori={KategoriTagihan.BUKU}
						labelTambah="Tambah Tagihan Buku"
						filterCabang={activeCabangId}
						filterStatus={statusFilter}
						searchQuery={debouncedSearch}
						filterKelas={kelasIdFilter}
						filterJenisKelas={jenisKelasFilter}
						filterLevel={levelFilter}
					/>
				</TabsContent>

				<TabsContent value="fee-registration" className="space-y-4">
					<TagihanLainTab
						kategori={KategoriTagihan.REGISTRASI}
						labelTambah="Tambah Biaya Registrasi"
						filterCabang={activeCabangId}
						filterStatus={statusFilter}
						searchQuery={debouncedSearch}
					/>
				</TabsContent>

				<TabsContent value="tagihan-lain" className="space-y-4">
					<TagihanLainTab
						kategori={KategoriTagihan.LAINNYA}
						labelTambah="Tambah Tagihan Lain"
						filterCabang={activeCabangId}
						filterStatus={statusFilter}
						searchQuery={debouncedSearch}
					/>
				</TabsContent>

				<TabsContent value="jatuh-tempo">
					<CardJatuhTempo className="w-full border-0 shadow-none" />
				</TabsContent>
			</Tabs>
		</div>
	);
}
