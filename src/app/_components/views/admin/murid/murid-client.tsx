"use client";

import { StatusMurid } from "@prisma/client";
import type { PaginationState } from "@tanstack/react-table";
import { FileSpreadsheet, Filter, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable as DataTablePagination } from "@/app/_components/shared/data-table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMurid } from "@/hooks/useMurid";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useMuridStore } from "@/store/useMuridStore";
import type { TypeAllMurid, TypeMuridNotRegistered } from "@/types/murid.type";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { downloadExcel } from "@/utils/exportUtils";
import { columns as createColumnsAllMurid } from "./columns/columns-murid";
import { columns as createColumnsMuridNotRegistered } from "./columns/columns-murid-not-registered";
import EditMurid from "./drawer/edit-murid";
import EditMuridNotRegistered from "./drawer/edit-murid-not-registered";
import RegistrasiMurid from "./drawer/registrasi-murid";
import TambahPendaftaranKelas from "./drawer/tambah-pendaftaran-kelas";

export default function MuridClient() {
	// STATE
	const { activeCabangId } = useGlobalCabangStore();
	const [paginationAllMurid, setPaginationAllMurid] = useState<PaginationState>(
		{
			pageIndex: 0,
			pageSize: 10,
		},
	);
	const [paginationNotRegistered, setPaginationNotRegistered] =
		useState<PaginationState>({
			pageIndex: 0,
			pageSize: 10,
		});

	const [deleteMuridDialogOpen, setDeleteMuridDialogOpen] = useState(false);
	const [selectedMuridToDelete, setSelectedMuridToDelete] = useState<{
		id: string;
		namaLengkap: string;
	} | null>(null);

	const [statusFilter, setStatusFilter] = useState<StatusMurid | "ALL">("ALL");
	const [tipeProgramFilter, setTipeProgramFilter] = useState<
		"REGULER" | "PRIVAT" | "ALL"
	>("ALL");
	const [filterNoWA, setFilterNoWA] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setPaginationAllMurid((prev) => ({ ...prev, pageIndex: 0 }));
		}, 500);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const { openDrawer } = useMuridStore();

	// HOOKS/QUERIES&MUTATIONS
	const {
		dataNotRegisteredPaginated,
		pageCountNotRegistered,
		isLoadingNotRegisteredPaginated,
		isFetchingNotRegisteredPaginated,
		refetchNotRegisteredPaginated,
	} = useMurid({
		pagination: paginationNotRegistered,
		filterCabang: activeCabangId,
	});

	const {
		dataAllMuridPaginated,
		pageCount,
		totalRows,
		isLoadingAllMuridPaginated,
		isFetchingAllMuridPaginated,
		refetchPaginated,
		fetchExportData,
		mutations,
		dataDuplicateNoWA,
	} = useMurid({
		pagination: paginationAllMurid,
		searchFilter: debouncedSearch,
		filterStatus: statusFilter,
		tipeProgram: tipeProgramFilter,
		filterCabang: activeCabangId,
		filterNoWA: filterNoWA ?? "ALL",
		enableDuplicateNoWAQuery: true,
		onSuccessDelete: () => {
			setDeleteMuridDialogOpen(false);
			setSelectedMuridToDelete(null);
		},
	});

	// HANDLERS
	const handleConfirmDeleteMurid = () => {
		if (!selectedMuridToDelete) return;
		mutations.delete.mutate({ id: selectedMuridToDelete.id });
		setSelectedMuridToDelete(null);
	};

	const handleEditNotRegistered = (item: TypeMuridNotRegistered) => {
		// Cast to TypeAllMurid to satisfy store type, as they share base fields
		openDrawer("edit-status", item as unknown as TypeAllMurid);
	};

	const handleExport = async () => {
		const toastId = toast.loading("Mengunduh data murid...");
		try {
			const data = await fetchExportData();

			if (!data || data.length === 0) {
				toast.error("Tidak ada data murid yang sesuai filter.", {
					id: toastId,
				});
				return;
			}

			// Format CSV
			const csvData = data.map((m) => ({
				"Nama Lengkap": m.namaLengkap,
				"No. WA": m.noWA ? `'${m.noWA}` : "-", // Tambah kutip agar excel baca text (bukan angka ilmiah)
				Email: m.email,
				"Asal Sekolah": m.asalSekolah,
				"Kelas Sekolah": m.kelasSekolah,
				"Program Minat": m.pilihanProgram ?? "-",
				Status: m.statusMurid,
				"Tanggal Gabung": formatDateToYYYYMMDD(m.createdAt),
			}));

			const filename = `Database-Murid-${statusFilter}-${new Date().toISOString().split("T")[0]}`;
			downloadExcel(csvData, filename);

			toast.success("Export berhasil!", { id: toastId });
		} catch (e) {
			console.error(e);
			toast.error("Gagal export data.", { id: toastId });
		}
	};

	// COLUMNS
	const columnsMuridNotRegistered = createColumnsMuridNotRegistered({
		onEditStatusClick: (item) => {
			handleEditNotRegistered(item);
		},
		onDeleteClick: (pendaftaranId) => {
			console.log("deleted", pendaftaranId);
		},
	});

	const columnsAllMurid = createColumnsAllMurid({
		onEditClick: (item) => {
			openDrawer("edit", item);
		},
		onEditStatusClick: (item) => {
			handleEditNotRegistered(item);
		},
		onDeleteClick: (id, namaLengkap) => {
			setSelectedMuridToDelete({ id, namaLengkap });
			setDeleteMuridDialogOpen(true);
		},
	});

	return (
		<Tabs defaultValue="daftarMurid">
			<TabsList>
				<TabsTrigger value="daftarMurid">
					Pendaftaran Murid ke Kelas
				</TabsTrigger>
				<TabsTrigger value="listMurid">List Semua Murid</TabsTrigger>
			</TabsList>
			<TabsContent value="daftarMurid">
				<div>
					<header className="flex w-full flex-col gap-4">
						<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
							<div className="flex flex-1 items-center gap-3">
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 shrink-0"
									disabled={
										isLoadingNotRegisteredPaginated ||
										isFetchingNotRegisteredPaginated
									}
									onClick={() => refetchNotRegisteredPaginated()}
									title="Refresh Jadwal"
								>
									<RefreshCw
										className={cn(
											"h-4 w-4",
											(isLoadingNotRegisteredPaginated ||
												isFetchingNotRegisteredPaginated) &&
												"animate-spin",
										)}
									/>
								</Button>
								<div className="flex flex-col">
									<h1 className="text-xl">
										Daftar Murid Belum Terdaftar ke Kelas
									</h1>
									<p className="text-muted-foreground text-sm">
										Halaman ini menampilkan daftar murid yang belum terdaftar ke
										kelas.
									</p>
								</div>
							</div>

							<TambahPendaftaranKelas />
						</div>
					</header>

					<DataTablePagination
						columns={columnsMuridNotRegistered}
						data={dataNotRegisteredPaginated ?? []}
						pageCount={pageCountNotRegistered}
						pagination={paginationNotRegistered}
						onPaginationChange={setPaginationNotRegistered}
						isLoading={isFetchingNotRegisteredPaginated}
					/>
				</div>
			</TabsContent>

			<TabsContent value="listMurid">
				<HeaderActionPortal>
					<Button variant="outline" size="sm" onClick={handleExport}>
						<FileSpreadsheet className="mr-2 h-4 w-4" />
						Export Database
					</Button>
				</HeaderActionPortal>

				<div>
					<header className="flex w-full flex-col gap-4">
						{/* --- TOP ROW: Refresh + Title --- */}
						<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
							<div className="flex flex-1 items-center gap-3">
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 shrink-0"
									disabled={
										isLoadingAllMuridPaginated || isFetchingAllMuridPaginated
									}
									onClick={() => refetchPaginated()}
									title="Refresh"
								>
									<RefreshCw
										className={cn(
											"h-4 w-4",
											(isLoadingAllMuridPaginated ||
												isFetchingAllMuridPaginated) &&
												"animate-spin",
										)}
									/>
								</Button>

								<div className="flex flex-col">
									<h1 className="text-xl">Daftar Murid</h1>
									<p className="text-muted-foreground text-sm leading-tight">
										Halaman ini menampilkan daftar semua murid. Total Data:{" "}
										<span className="text-foreground">{totalRows}</span> Murid
									</p>
								</div>
							</div>

							{/* Action button kanan (di desktop) */}
							<RegistrasiMurid />
						</div>

						{/* --- SEARCH + FILTER: mobile-first, turun ke bawah --- */}
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							{/* Search */}
							<div className="relative w-full sm:w-60">
								<Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
								<Input
									placeholder="Cari nama murid..."
									className="pl-8"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							<div className="flex flex-wrap gap-2">
								{/* Filter Duplicate WA */}
								{dataDuplicateNoWA.length > 0 && (
									<Select
										value={filterNoWA ?? "ALL"}
										onValueChange={(val) => {
											setFilterNoWA(val === "ALL" ? null : val);
											setPaginationAllMurid((prev) => ({
												...prev,
												pageIndex: 0,
											}));
										}}
									>
										<SelectTrigger className="w-full sm:w-50">
											<div className="text-muted-foreground flex items-center gap-2">
												<Filter className="h-3.5 w-3.5" />
												<SelectValue placeholder="Filter Duplikat WA" />
											</div>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ALL">Semua No WA</SelectItem>
											{dataDuplicateNoWA.map((item) => (
												<SelectItem key={item.noWA} value={item.noWA}>
													{item.noWA} ({item.count})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}

								{/* Filter Tipe Program */}
								<Select
									value={tipeProgramFilter}
									onValueChange={(val) => {
										setTipeProgramFilter(val as "REGULER" | "PRIVAT" | "ALL");
										setPaginationAllMurid((prev) => ({
											...prev,
											pageIndex: 0,
										}));
									}}
								>
									<SelectTrigger className="w-full sm:w-50">
										<div className="text-muted-foreground flex items-center gap-2">
											<Filter className="h-3.5 w-3.5" />
											<SelectValue placeholder="Status" />
										</div>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">Semua Tipe Program</SelectItem>
										<SelectItem value="REGULER">Reguler</SelectItem>
										<SelectItem value="PRIVAT">Privat</SelectItem>
									</SelectContent>
								</Select>

								{/* Filter Status */}
								<Select
									value={statusFilter}
									onValueChange={(val) => {
										setStatusFilter(val as StatusMurid | "ALL");
										setPaginationAllMurid((prev) => ({
											...prev,
											pageIndex: 0,
										}));
									}}
								>
									<SelectTrigger className="w-full sm:w-40">
										<div className="text-muted-foreground flex items-center gap-2">
											<Filter className="h-3.5 w-3.5" />
											<SelectValue placeholder="Status" />
										</div>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">Semua Status</SelectItem>
										{Object.values(StatusMurid).map((status) => (
											<SelectItem key={status} value={status}>
												{status
													.replaceAll("_", " ")
													.toLowerCase()
													.replace(/\b\w/g, (c) => c.toUpperCase())}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</header>

					<EditMurid />
					<DeleteConfirmationDialog
						isOpen={deleteMuridDialogOpen}
						onOpenChange={setDeleteMuridDialogOpen}
						title="Hapus Murid"
						description={
							<>
								Yakin ingin menghapus Murid{" "}
								<span className="text-accent font-bold">
									{selectedMuridToDelete?.namaLengkap}
								</span>
								? Tindakan ini tidak dapat dibatalkan.
							</>
						}
						onConfirm={handleConfirmDeleteMurid}
						isLoading={mutations.delete.isPending}
						confirmText="Hapus"
						cancelText="Batal"
					/>

					<DataTablePagination
						columns={columnsAllMurid}
						data={dataAllMuridPaginated}
						pageCount={pageCount}
						pagination={paginationAllMurid}
						onPaginationChange={setPaginationAllMurid}
						isLoading={isFetchingAllMuridPaginated}
					/>
				</div>
			</TabsContent>
			<EditMuridNotRegistered />
		</Tabs>
	);
}
