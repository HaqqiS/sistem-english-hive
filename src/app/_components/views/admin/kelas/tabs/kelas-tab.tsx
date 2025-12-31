"use client";

import { type JenisKelasModel, TipeKelas } from "@prisma/client";
import { AlertCircle, FileSpreadsheet, Filter, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { useKelas } from "@/hooks/useKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useGuruKelasStore, useKelasStore } from "@/store/useKelasStore";
import type { TypeKelasWithSesiPertemuanCount } from "@/types/kelas.type";
import { downloadExcel } from "@/utils/exportUtils";
import EditGuruKelas from "../drawers/edit-guru-kelas";
import EditKelas from "../drawers/edit-kelas";
import TambahProgramKelas from "../drawers/tambah-kelas";
import UpLevelKelas from "../drawers/up-level-kelas";
import { KelasListView } from "./kelas-list-view";

export default function KelasTab() {
	const { activeCabangId } = useGlobalCabangStore();
	// 1. State Lokal untuk Delete Dialog
	const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
	const [selectedKelasToDelete, setSelectedKelasToDelete] =
		useState<TypeKelasWithSesiPertemuanCount | null>(null);

	const [selectedTipeKelas, setSelectedTipeKelas] = useState<TipeKelas | "ALL">(
		"ALL",
	);
	const [selectedJenisKelas, setSelectedJenisKelas] = useState<string | "ALL">(
		"ALL",
	);
	const [selectedLevelKelas, setSelectedLevelKelas] = useState<number | "ALL">(
		"ALL",
	);

	// 2. Zustand Store Actions
	const { openDrawer: openKelasDrawer } = useKelasStore();
	const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();

	const { data: jenisKelasList } = useJenisKelas();

	const {
		dataKelasCount,
		isLoadingKelasCount,
		isErrorKelasCount,
		isRefetchingKelasCount,
		errorKelasCount,
		refetchKelasCount,

		// Waiting
		dataKelasWaiting,
		isLoadingKelasWaiting,
		refetchKelasWaiting,

		// Trial
		dataKelasTrial,
		isLoadingKelasTrial,
		refetchKelasTrial,

		fetchExportData,
		mutations: kelasMutations,
	} = useKelas({
		filterCabang: activeCabangId,
		tipeKelas: selectedTipeKelas,
		jenisKelas: selectedJenisKelas,
		levelKelas: selectedLevelKelas,
		enableQueryGetKelasCount: true,
		enableQueryGetKelasWaitingCount: true,
		enableQueryGetKelasTrialCount: true,

		onSuccessDelete: () => {
			setDeleteKelasDialogOpen(false);
			setSelectedKelasToDelete(null);
		},
	});

	// 4. Handlers
	const handleEditClickKelas = (item: TypeKelasWithSesiPertemuanCount) => {
		// Perlu casting karena TypeKelasWithSesiPertemuanCount strukturnya mirip TypeKelas
		// tapi ada tambahan _count. Untuk form edit, data dasar sudah cukup.
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
				// Ambil nama guru (jika ada)
				const guru = item.historyGuruKelases[0]?.guru.name ?? "Belum Ada";

				// Gabungkan hari jadwal (misal: "SENIN, RABU")
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
					"Daftar Murid":
						item.pendaftaranKelases
							?.map((p) => p.murid.namaLengkap)
							.join(", ") ?? "-",
					"Harga Kelas": item.hargaKelas, // Angka murni agar bisa diolah Excel
				};
			});

			const filename = `Laporan-Kelas-Operasional-${
				new Date().toISOString().split("T")[0]
			}`;
			downloadExcel(csvData, filename);

			toast.success("Export berhasil!", { id: toastId });
		} catch (e) {
			console.error(e);
			toast.error("Gagal mengexport data.", { id: toastId });
		}
	};

	const handleRefetchAll = () => {
		refetchKelasCount();
		refetchKelasWaiting();
		refetchKelasTrial();
	};

	const isAnyLoading =
		isLoadingKelasCount || isLoadingKelasWaiting || isLoadingKelasTrial;

	if (isErrorKelasCount) {
		return (
			<Card className="border-destructive bg-destructive/10 mt-4">
				<CardHeader className="flex flex-row items-center gap-3 space-y-0">
					<AlertCircle className="text-destructive h-6 w-6" />
					<CardTitle className="text-destructive">Gagal Memuat Data</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-destructive/80 text-sm">
						{errorKelasCount?.message ?? "Terjadi kesalahan tidak diketahui."}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<HeaderActionPortal>
				<Button variant="ghost" size="sm" onClick={handleExport}>
					<FileSpreadsheet className="mr-2 h-4 w-4" />
					Export Excel
				</Button>
			</HeaderActionPortal>

			<header className="flex w-full flex-col gap-4">
				<div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
					<div className="flex flex-1 items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9 shrink-0"
							disabled={isAnyLoading || isRefetchingKelasCount}
							onClick={handleRefetchAll}
							title="Refresh Jadwal"
						>
							<RefreshCw
								className={cn(
									"h-4 w-4",
									(isAnyLoading || isRefetchingKelasCount) && "animate-spin",
								)}
							/>
						</Button>
						<div>
							<h1 className="text-xl">Daftar Kelas</h1>
							<p className="text-muted-foreground text-sm">
								{isLoadingKelasCount ? "..." : (dataKelasCount?.length ?? 0)}{" "}
								Running {" • "}
								{isLoadingKelasTrial ? "..." : (dataKelasTrial?.length ?? 0)}{" "}
								Trial {" • "}
								{isLoadingKelasWaiting
									? "..."
									: (dataKelasWaiting?.length ?? 0)}{" "}
								Waiting
							</p>
						</div>
					</div>

					<TambahProgramKelas />
				</div>

				<div className="flex flex-wrap gap-2">
					<Select
						value={selectedTipeKelas}
						onValueChange={(v) => setSelectedTipeKelas(v as TipeKelas | "ALL")}
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
									{tipe.charAt(0).toUpperCase() + tipe.slice(1).toLowerCase()}
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
										<div className="flex items-center gap-2">{jenis.nama}</div>
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
			</header>

			<Tabs defaultValue="running" className="w-full">
				<TabsList>
					<TabsTrigger value="running">
						Running ({dataKelasCount?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="trial">
						Trial ({dataKelasTrial?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="waiting">
						Waiting ({dataKelasWaiting?.length ?? 0})
					</TabsTrigger>
				</TabsList>
				<TabsContent value="running" className="mt-4">
					<KelasListView
						data={dataKelasCount}
						isLoading={isLoadingKelasCount}
						onEditKelas={handleEditClickKelas}
						onEditGuruKelas={handleEditClickGuruKelas}
						onUpLevel={handleUpLevelClick}
						onDelete={handleDeleteClick}
						emptyMessage="Belum ada kelas berstatus Running."
					/>
				</TabsContent>
				<TabsContent value="trial" className="mt-4">
					<KelasListView
						data={dataKelasTrial}
						isLoading={isLoadingKelasTrial}
						onEditKelas={handleEditClickKelas}
						onEditGuruKelas={handleEditClickGuruKelas}
						onUpLevel={handleUpLevelClick}
						onDelete={handleDeleteClick}
						emptyMessage="Belum ada kelas berstatus Trial."
					/>
				</TabsContent>
				<TabsContent value="waiting" className="mt-4">
					<KelasListView
						data={dataKelasWaiting}
						isLoading={isLoadingKelasWaiting}
						onEditKelas={handleEditClickKelas}
						onEditGuruKelas={handleEditClickGuruKelas}
						onUpLevel={handleUpLevelClick}
						onDelete={handleDeleteClick}
						emptyMessage="Belum ada kelas berstatus Waiting."
					/>
				</TabsContent>
			</Tabs>

			<EditKelas />
			<EditGuruKelas />
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
		</div>
	);
}
