"use client";

import { type JenisKelasModel, TipeKelas } from "@prisma/client";
import { AlertCircle, FileSpreadsheet, Filter, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { useKelas } from "@/hooks/useKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useJadwalKelasStore } from "@/store/useJadwalKelasStore";
import { useGuruKelasStore, useKelasStore } from "@/store/useKelasStore";
import type { TypeKelasWithSesiPertemuanCount } from "@/types/kelas.type";
import { downloadExcel } from "@/utils/exportUtils";
import EditJadwalKelas from "../jadwal/edit-jadwal";
import TambahJadwalKelas from "../jadwal/tambah-jadwal";
import { columns as jadwalColumns } from "./columns/columns-jadwal";
import EditGuruKelas from "./drawers/edit-guru-kelas";
import EditKelas from "./drawers/edit-kelas";
import TambahProgramKelas from "./drawers/tambah-kelas";
import UpLevelKelas from "./drawers/up-level-kelas";
import { KelasListView } from "./tabs/kelas-list-view";

interface KelasPageContentProps {
	viewMode: "running" | "trial" | "waiting";
}

export default function KelasPageContent({ viewMode }: KelasPageContentProps) {
	const { activeCabangId } = useGlobalCabangStore();

	// --- 1. State Lokal untuk Delete Dialog (KELAS) ---
	const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
	const [selectedKelasToDelete, setSelectedKelasToDelete] =
		useState<TypeKelasWithSesiPertemuanCount | null>(null);

	// --- 2. State Lokal untuk Delete Dialog (JADWAL) ---
	const [deleteJadwalDialogOpen, setDeleteJadwalDialogOpen] = useState(false);
	const [selectedJadwalToDelete, setSelectedJadwalToDelete] = useState<{
		id: string;
		deskripsi: string;
	} | null>(null);

	// --- 3. Filters ---
	const [selectedTipeKelas, setSelectedTipeKelas] = useState<TipeKelas | "ALL">(
		"ALL",
	);
	const [selectedJenisKelas, setSelectedJenisKelas] = useState<string | "ALL">(
		"ALL",
	);
	const [selectedLevelKelas, setSelectedLevelKelas] = useState<number | "ALL">(
		"ALL",
	);

	// --- 4. Store Actions ---
	const { openDrawer: openKelasDrawer } = useKelasStore();
	const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();
	const { openDrawer: openJadwalDrawer } = useJadwalKelasStore();

	const { data: jenisKelasList } = useJenisKelas();

	// --- 5. DATA FETCHING: KELAS ---
	const {
		// Running
		dataKelasCount,
		isLoadingKelasCount,
		isRefetchingKelasCount,
		errorKelasCount,
		refetchKelasCount,

		// Waiting
		dataKelasWaiting,
		isLoadingKelasWaiting,
		errorKelasWaiting,
		refetchKelasWaiting,

		// Trial
		dataKelasTrial,
		isLoadingKelasTrial,
		errorKelasTrial,
		refetchKelasTrial,

		fetchExportData,
		mutations: kelasMutations,
	} = useKelas({
		filterCabang: activeCabangId,
		tipeKelas: selectedTipeKelas,
		jenisKelas: selectedJenisKelas,
		levelKelas: selectedLevelKelas,
		enableQueryGetKelasCount: viewMode === "running",
		enableQueryGetKelasWaitingCount: viewMode === "waiting",
		enableQueryGetKelasTrialCount: viewMode === "trial",

		onSuccessDelete: () => {
			setDeleteKelasDialogOpen(false);
			setSelectedKelasToDelete(null);
		},
	});

	// --- 6. DATA FETCHING: JADWAL ---
	const {
		dataJadwalRunning,
		isLoadingDataJadwalRunning,
		dataJadwalTrial,
		isLoadingDataJadwalTrial,
		dataJadwalWaiting,
		isLoadingDataJadwalWaiting,
		mutations: jadwalMutation,
	} = useJadwalKelas({
		filterCabang: activeCabangId,
		enableQueryAllRunning: viewMode === "running",
		enableQueryAllTrial: viewMode === "trial",
		enableQueryAllWaiting: viewMode === "waiting",
		onSuccessDelete: () => {
			setDeleteJadwalDialogOpen(false);
			setSelectedJadwalToDelete(null);
		},
	});

	// --- 7. Computed Active Data ---
	const activeData =
		viewMode === "running"
			? dataKelasCount
			: viewMode === "trial"
				? dataKelasTrial
				: dataKelasWaiting;

	const isLoading =
		viewMode === "running"
			? isLoadingKelasCount
			: viewMode === "trial"
				? isLoadingKelasTrial
				: isLoadingKelasWaiting;

	const isLoadingJadwal =
		viewMode === "running"
			? isLoadingDataJadwalRunning
			: viewMode === "trial"
				? isLoadingDataJadwalTrial
				: isLoadingDataJadwalWaiting;

	const isError =
		viewMode === "running"
			? errorKelasCount
			: viewMode === "trial"
				? errorKelasTrial
				: errorKelasWaiting;

	const error =
		viewMode === "running"
			? errorKelasCount
			: viewMode === "trial"
				? errorKelasTrial
				: errorKelasWaiting;

	const activeJadwalData =
		viewMode === "running"
			? dataJadwalRunning
			: viewMode === "trial"
				? dataJadwalTrial
				: dataJadwalWaiting;

	// --- 8. HANDLERS ---
	const handleEditClickKelas = (item: TypeKelasWithSesiPertemuanCount) => {
		openKelasDrawer("edit", item);
	};

	const handleEditClickGuruKelas = (item: TypeKelasWithSesiPertemuanCount) => {
		const history = item.historyGuruKelases?.[0];
		if (history) {
			// @ts-expect-error: types compatible
			openGuruKelasDrawer("edit", history);
		} else {
			toast.error("Tidak ada data guru aktif untuk diedit.");
		}
	};

	const handleUpLevelClick = (item: TypeKelasWithSesiPertemuanCount) => {
		openKelasDrawer("upLevel", item);
	};

	const handleDeleteClick = (item: TypeKelasWithSesiPertemuanCount) => {
		setSelectedKelasToDelete(item);
		setDeleteKelasDialogOpen(true);
	};

	const handleConfirmDeleteKelas = async () => {
		if (!selectedKelasToDelete) return;
		await kelasMutations.delete.mutateAsync({ id: selectedKelasToDelete.id });
	};

	const handleConfirmDeleteJadwal = async () => {
		if (!selectedJadwalToDelete) return;
		await jadwalMutation.delete.mutateAsync({ id: selectedJadwalToDelete.id });
	};

	const handleExport = async () => {
		const toastId = toast.loading("Mengunduh data kelas...");
		try {
			const data = await fetchExportData();

			if (!data || data.length === 0) {
				toast.error("Tidak ada data kelas untuk diexport.", { id: toastId });
				return;
			}

			// Format Data untuk CSV
			const csvData = data.map((item) => {
				const guru = item.historyGuruKelases[0]?.guru.name ?? "Belum Ada";
				const jadwal =
					item.jadwalKelas.length > 0
						? item.jadwalKelas.map((j: { hari: string }) => j.hari).join(", ")
						: "-";

				return {
					"Kode Kelas": item.kodeKelas,
					Cabang: item.cabang.namaCabang,
					Program: item.jenisKelasRel?.nama ?? "Unknown",
					Level: item.level,
					Tipe: item.jenisKelasRel?.tipe ?? "Unknown",
					Grup: item.grup ?? "-",
					// Status: item.statusKelas ?? "RUNNING",
					Pengajar: guru,
					Jadwal: jadwal,
					"Jumlah Murid": item._count.pendaftaranKelases,
					"Sesi Berjalan": item._count.sesiPertemuanKelases,
					Deskripsi: item.deskripsi ?? "-",
					"Harga Kelas": item.hargaKelas,
				};
			});

			const filename = `Laporan-Kelas-${viewMode.toUpperCase()}-${
				new Date().toISOString().split("T")[0]
			}`;
			downloadExcel(csvData, filename);

			toast.success("Export berhasil!", { id: toastId });
		} catch (e) {
			console.error(e);
			toast.error("Gagal mengexport data.", { id: toastId });
		}
	};

	const handleRefetch = () => {
		if (viewMode === "running") refetchKelasCount();
		if (viewMode === "trial") refetchKelasTrial();
		if (viewMode === "waiting") refetchKelasWaiting();
	};

	// --- 9. Define Table Columns for Jadwal ---
	const columnsJadwalTabel = jadwalColumns({
		onEditClick: (item) => {
			openJadwalDrawer("edit", item);
		},
		onDeleteClick: (id, deskripsi) => {
			setSelectedJadwalToDelete({ id, deskripsi });
			setDeleteJadwalDialogOpen(true);
		},
	});

	if (isError) {
		return (
			<Card className="border-destructive bg-destructive/10 mt-4">
				<CardHeader className="flex flex-row items-center gap-3 space-y-0">
					<AlertCircle className="text-destructive h-6 w-6" />
					<CardTitle className="text-destructive">Gagal Memuat Data</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-destructive/80 text-sm">
						{error?.message ?? "Terjadi kesalahan tidak diketahui."}
					</p>
				</CardContent>
			</Card>
		);
	}

	const getPageTitle = () => {
		switch (viewMode) {
			case "running":
				return "Kelas Running";
			case "trial":
				return "Kelas Trial";
			case "waiting":
				return "Kelas Waiting List";
		}
	};

	const getEmptyMessage = () => {
		switch (viewMode) {
			case "running":
				return "Belum ada kelas berstatus Running.";
			case "trial":
				return "Belum ada kelas berstatus Trial.";
			case "waiting":
				return "Belum ada kelas berstatus Waiting.";
		}
	};

	return (
		<div className="space-y-4 mt-4">
			<HeaderActionPortal>
				<Button variant="ghost" size="sm" onClick={handleExport}>
					<FileSpreadsheet className="mr-2 h-4 w-4" />
					Export Excel
				</Button>
			</HeaderActionPortal>

			<Tabs defaultValue="listKelas" className="w-full">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
						<div className="flex flex-row items-center gap-3">
							<Button
								variant="ghost"
								size="icon"
								className="h-9 w-9 shrink-0"
								disabled={isLoading || isRefetchingKelasCount}
								onClick={handleRefetch}
								title="Refresh Data"
							>
								<RefreshCw
									className={cn(
										"h-4 w-4",
										(isLoading || isRefetchingKelasCount) && "animate-spin",
									)}
								/>
							</Button>
							<div>
								<h1 className="text-xl">{getPageTitle()}</h1>
								<p className="text-muted-foreground text-sm">
									{isLoading ? "..." : (activeData?.length ?? 0)} kelas
									terdaftar
								</p>
							</div>
						</div>

						<TabsList>
							<TabsTrigger value="listKelas">Daftar Kelas</TabsTrigger>
							<TabsTrigger value="jadwalKelas">Jadwal Kelas</TabsTrigger>
						</TabsList>
					</div>
				</div>

				<TabsContent value="listKelas" className="mt-4">
					<div className="mb-6 flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-center">
						{/* Filters */}
						<div className="flex flex-wrap gap-2">
							<Select
								value={selectedTipeKelas}
								onValueChange={(v) =>
									setSelectedTipeKelas(v as TipeKelas | "ALL")
								}
							>
								<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[160px]">
									<div className="flex items-center gap-2">
										<Filter className="text-muted-foreground h-4 w-4" />
										<span className="font-medium">
											<SelectValue />
										</span>
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Semua Tipe Kelas</SelectItem>
									{Object.values(TipeKelas).map((tipe) => (
										<SelectItem key={tipe} value={tipe}>
											{tipe.charAt(0).toUpperCase() +
												tipe.slice(1).toLowerCase()}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={selectedJenisKelas}
								onValueChange={(v) => setSelectedJenisKelas(v)}
							>
								<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[160px]">
									<div className="flex items-center gap-2">
										<Filter className="text-muted-foreground h-4 w-4" />
										<span className="font-medium">
											<SelectValue />
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
										.map((jenis: JenisKelasModel) => (
											<SelectItem key={jenis.nama} value={jenis.nama}>
												<div className="flex items-center gap-2">
													{jenis.nama}
												</div>
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							<Select
								value={selectedLevelKelas.toString()}
								onValueChange={(v) =>
									setSelectedLevelKelas(v === "ALL" ? "ALL" : Number(v))
								}
							>
								<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-[160px]">
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

						{/* Action Button for List Mode */}
						<TambahProgramKelas />
					</div>

					<KelasListView
						data={activeData}
						isLoading={isLoading}
						onEditKelas={handleEditClickKelas}
						onEditGuruKelas={handleEditClickGuruKelas}
						onUpLevel={handleUpLevelClick}
						onDelete={handleDeleteClick}
						emptyMessage={getEmptyMessage()}
					/>
				</TabsContent>

				<TabsContent value="jadwalKelas" className="mt-4">
					<div className="mb-4 flex flex-row justify-end">
						<TambahJadwalKelas />
					</div>
					<DataTable
						columns={columnsJadwalTabel}
						data={activeJadwalData ?? []}
						isLoading={isLoadingJadwal}
					/>
				</TabsContent>
			</Tabs>

			<EditKelas />
			<EditGuruKelas />
			<EditJadwalKelas />
			<UpLevelKelas />

			<DeleteConfirmationDialog
				isOpen={deleteKelasDialogOpen}
				onOpenChange={setDeleteKelasDialogOpen}
				title="Hapus Kelas"
				description={
					<>
						Yakin ingin menghapus Kelas{" "}
						<span className="text-accent font-bold">
							{selectedKelasToDelete?.kodeKelas}
						</span>
						? Tindakan ini tidak dapat dibatalkan.
					</>
				}
				onConfirm={handleConfirmDeleteKelas}
				isLoading={kelasMutations.delete.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>

			<DeleteConfirmationDialog
				isOpen={deleteJadwalDialogOpen}
				onOpenChange={setDeleteJadwalDialogOpen}
				title="Hapus Jadwal Kelas"
				description={
					<>
						Yakin ingin menghapus Jadwal Kelas{" "}
						<span className="text-accent font-bold">
							{selectedJadwalToDelete?.deskripsi}
						</span>
						? Tindakan ini tidak dapat dibatalkan.
					</>
				}
				onConfirm={handleConfirmDeleteJadwal}
				isLoading={jadwalMutation.delete.isPending}
				confirmText="Hapus"
				cancelText="Batal"
			/>
		</div>
	);
}
