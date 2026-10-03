"use client";

import {
	ArrowLeft,
	CalendarClock,
	CalendarDays,
	Edit,
	FileText,
	History,
	School,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";
import { useKelas } from "@/hooks/useKelas";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { cn } from "@/lib/utils";
import {
	useGuruKelasStore,
	usePendaftaranKelasStore,
} from "@/store/useKelasStore";
import type { TypeKelasDetail } from "@/types/kelas.type";
import { exportAbsensiPDF } from "@/utils/pdfExportUtils";

import { columns as guru } from "../columns/columns-list-guru";
import { columns as murid } from "../columns/columns-list-murid";
import EditGuruKelas from "../drawers/edit-guru-kelas";
import EditMuridDetailKelas from "../drawers/edit-murid";
import TambahGuruKelas from "../drawers/tambah-guru-kelas";
import TambahMuridDetailKelas from "../drawers/tambah-murid";
import { BulkActivateDialog } from "./bulk-activate-dialog";
import { ClassHistoryTimeline } from "./class-history-timeline";

// Label & warna badge untuk status kelas — dipakai di header detail kelas
const statusKelasLabelMap: Record<string, string> = {
	RUNNING: "Running",
	WAITING: "Waiting",
	TRIAL: "Trial",
	LEVEL_UP: "Level Up",
	COMPLETED: "Completed",
};

const statusKelasColorMap: Record<string, string> = {
	RUNNING: "bg-green-100 text-green-700 border-green-200",
	WAITING: "bg-amber-100 text-amber-700 border-amber-200",
	TRIAL: "bg-blue-100 text-blue-700 border-blue-200",
	LEVEL_UP: "bg-purple-100 text-purple-700 border-purple-200",
	COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function DetailKelasClient() {
	// STATE
	const [
		deletePendaftaranKelasDialogOpen,
		setDeletePendaftaranKelasDialogOpen,
	] = useState(false);
	const [
		selectedPendaftaranKelasToDelete,
		setSelectedPendaftaranKelasToDelete,
	] = useState<{ id: string; namaMurid: string } | null>(null);

	const [
		deleteHistoryGuruKelasDialogOpen,
		setDeleteHistoryGuruKelasDialogOpen,
	] = useState(false);
	const [
		selectedHistoryGuruKelasToDelete,
		setSelectedHistoryGuruKelasToDelete,
	] = useState<{ id: string; namaGuru: string } | null>(null);

	const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
	const [selectedGuruToToggle, setSelectedGuruToToggle] = useState<{
		id: string;
		namaGuru: string;
		currentStatus: "ACTIVE" | "INACTIVE";
	} | null>(null);

	const { openDrawer: openGuruDrawer } = useGuruKelasStore();
	const { openDrawer: openPendaftaranDrawer } = usePendaftaranKelasStore();

	const { kelasId } = useParams<{ kelasId: string }>();

	//HOOKS/QUERIES&MUTATIONS
	const { dataById } = useKelas({ kelasId });

	const { dataByKelasId, mutations: pendaftaranKelasMutations } =
		usePendaftaranKelas({
			enableQuery: !!kelasId,
			kelasId,
			onSuccessDelete() {
				setDeletePendaftaranKelasDialogOpen(false);
				setSelectedPendaftaranKelasToDelete(null);
			},
		});

	const {
		dataById: dataGuruByKelasId,
		isLoadingById: loadingGuru,
		mutations: historyGuruKelasMutations,
	} = UseHistoryGuruKelas({
		kelasId,
		enableQuery: !!kelasId,
		onSuccessDelete() {
			setDeleteHistoryGuruKelasDialogOpen(false);
			setSelectedHistoryGuruKelasToDelete(null);
		},
	});

	const activeGuruHistories = useMemo(
		() => dataGuruByKelasId?.filter((h) => h.statusGuru === "ACTIVE") ?? [],
		[dataGuruByKelasId],
	);

	// HANDLERS
	const handleOpenEditDrawer = () => {
		const guruToEdit = activeGuruHistories[0];
		if (activeGuruHistories.length === 1 && guruToEdit) {
			openGuruDrawer("edit", guruToEdit);
		}
	};

	const handleToggleStatus = (
		id: string,
		currentStatus: "ACTIVE" | "INACTIVE",
		namaGuru: string,
	) => {
		setSelectedGuruToToggle({ id, namaGuru, currentStatus });
		setToggleStatusDialogOpen(true);
	};

	const handleConfirmToggleStatus = () => {
		if (!selectedGuruToToggle) return;

		const newStatus =
			selectedGuruToToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

		historyGuruKelasMutations.toggleStatus.mutate(
			{
				id: selectedGuruToToggle.id,
				status: newStatus,
			},
			{
				onSuccess: () => {
					setToggleStatusDialogOpen(false);
					setSelectedGuruToToggle(null);
				},
			},
		);
	};
	// ... existing handlers ...

	const handleConfirmDeletePendaftaranKelas = () => {
		if (!selectedPendaftaranKelasToDelete) return;
		pendaftaranKelasMutations.delete.mutate({
			id: selectedPendaftaranKelasToDelete.id,
		});
	};

	const handleConfirmDeleteGuruKelas = () => {
		if (!selectedHistoryGuruKelasToDelete) return;
		historyGuruKelasMutations.delete.mutate({
			id: selectedHistoryGuruKelasToDelete.id,
			kelasId: kelasId,
		});
	};

	const handleExportAbsensi = () => {
		if (!dataByKelasId || !dataById) return;

		// 0. Format String Jadwal
		// Type safety: Explicitly cast using RouterOutputs (or inferred)
		const kelas = dataById as TypeKelasDetail;

		const jadwalList = kelas.jadwalKelas?.map((j) => {
			const slot = j.jamSlotTetap || j.jamSlotCustom;
			// Append Ruang if available
			const ruangStr = j.ruang?.namaRuang ? ` ${j.ruang.namaRuang}` : "";

			if (!slot) return `${j.hari}${ruangStr}`;
			return `${j.hari} (${slot.jamMulai} - ${slot.jamSelesai})${ruangStr}`;
		});
		const jadwalString = jadwalList?.join(" & ") ?? "-";

		// 1. Siapkan Info Kelas
		// Join all active teacher names
		const pengajarNames =
			activeGuruHistories.length > 0
				? activeGuruHistories.map((h) => h.guru.name).join(" & ")
				: undefined;

		const classInfo = {
			kodeKelas: kelas.kodeKelas,
			level: kelas.level,
			grup: kelas.grup,
			bulanTahun: kelas.bulanTahunAjar,
			pengajar: pengajarNames,
			jadwal: jadwalString,
		};

		// 2. Siapkan Data Murid
		const students = dataByKelasId.map((item) => ({
			namaMurid: item.murid.namaLengkap,
		}));

		// 3. Export PDF
		exportAbsensiPDF(classInfo, students);
	};

	// COLUMNS
	const columnsMurid = murid({
		onEditClick: (item) => {
			// console.log("Edit clicked for:", item);
			openPendaftaranDrawer("edit", item);
		},
		onDeleteClick: (id, namaLengkap) => {
			// console.log(`Delete clicked for ID: ${id}, Name: ${namaLengkap}`);
			setSelectedPendaftaranKelasToDelete({ id, namaMurid: namaLengkap });
			setDeletePendaftaranKelasDialogOpen(true);
		},
	});

	const columnsGuru = guru({
		onEditClick: (item) => {
			openGuruDrawer("edit", item);
		},
		onDeleteClick: (id, namaGuru) => {
			// console.log(`Delete clicked for ID: ${id}, Name: ${namaGuru}`);
			setSelectedHistoryGuruKelasToDelete({ id, namaGuru });
			setDeleteHistoryGuruKelasDialogOpen(true);
		},
		onToggleStatus: handleToggleStatus,
	});

	return (
		<div className="space-y-8">
			<HeaderActionPortal>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link href={`/admin/kelas/sesi/${kelasId}`}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							<span className="hidden sm:inline">Detail Sesi</span>
							<span className="sm:hidden">Sesi</span>
						</Link>
					</Button>
					<Button variant="outline" size="sm" onClick={handleExportAbsensi}>
						<FileText className="mr-2 h-4 w-4" />
						<span className="hidden sm:inline">Export PDF Absen</span>
						<span className="sm:hidden">Export</span>
					</Button>
				</div>
			</HeaderActionPortal>

			<AlertDialog
				open={toggleStatusDialogOpen}
				onOpenChange={setToggleStatusDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin mengubah status{" "}
							<span className="text-foreground font-bold">
								{selectedGuruToToggle?.namaGuru}
							</span>{" "}
							menjadi{" "}
							<span className="text-foreground font-bold">
								{selectedGuruToToggle?.currentStatus === "ACTIVE"
									? "Tidak Aktif"
									: "Aktif"}
							</span>
							?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleConfirmToggleStatus();
							}}
							className={
								selectedGuruToToggle?.currentStatus === "ACTIVE"
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
									: ""
							}
							disabled={historyGuruKelasMutations.toggleStatus.isPending}
						>
							{historyGuruKelasMutations.toggleStatus.isPending
								? "Memproses..."
								: "Ya, Ubah Status"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* --- STICKY HEADER: Info Kelas, nempel di atas saat discroll --- */}
			<div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 -mx-2 -mt-2 border-b px-2 py-4 backdrop-blur lg:-mx-4 lg:-mt-4 lg:px-4">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex min-w-0 items-start gap-3 sm:items-center">
						<div className="text-primary flex h-11 w-11 shrink-0 items-center justify-center">
							<School className="h-6 w-6" />
						</div>

						{dataById ? (
							<div className="min-w-0">
								<div className="flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
									<h1 className="flex flex-col text-lg font-semibold leading-tight tracking-tight sm:flex-row sm:flex-wrap sm:gap-x-2">
										{dataById.kodeKelas
											.split("|")
											.map((p) => p.trim())
											.map((part) => (
												<span key={part}>{part}</span>
											))}
									</h1>
									{dataById.statusKelas && (
										<Badge
											variant="outline"
											className={cn(
												"shrink-0 font-medium",
												statusKelasColorMap[dataById.statusKelas],
											)}
										>
											{statusKelasLabelMap[dataById.statusKelas] ??
												dataById.statusKelas}
										</Badge>
									)}
								</div>
							</div>
						) : (
							<div className="min-w-0 space-y-1.5">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-3 w-32" />
							</div>
						)}
					</div>

					{/* Ringkasan cepat: jumlah murid & guru aktif */}
					{dataById && (
						<div className="flex shrink-0 items-center gap-4 text-sm sm:border-l sm:pl-4">
							<div className="text-center">
								<div className="font-semibold leading-none">
									{dataByKelasId?.length ?? 0}
								</div>
								<div className="text-muted-foreground mt-1 text-[11px] whitespace-nowrap">
									Murid
								</div>
							</div>
							<div className="text-center">
								<div className="font-semibold leading-none">
									{loadingGuru ? "-" : activeGuruHistories.length}
								</div>
								<div className="text-muted-foreground mt-1 text-[11px] whitespace-nowrap">
									Guru Aktif
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* --- KOLOM KIRI (UTAMA): Murid & Guru --- */}
			<div className="space-y-8">
				{/* HEADER & MURID */}
				<div className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="text-muted-foreground text-sm">
								Kelola siswa yang terdaftar di kelas ini.
							</p>
						</div>
						<div className="flex shrink-0 flex-wrap items-center gap-2">
							<TambahMuridDetailKelas kelasId={kelasId} />
							<EditMuridDetailKelas />
						</div>
						<DeleteConfirmationDialog
							isOpen={deletePendaftaranKelasDialogOpen}
							onOpenChange={setDeletePendaftaranKelasDialogOpen}
							title="Hapus Murid dari Kelas"
							description={
								<>
									Yakin ingin menghapus murid{" "}
									<span className="text-accent font-bold">
										{selectedPendaftaranKelasToDelete?.namaMurid}
									</span>{" "}
									dari kelas ? Tindakan ini tidak dapat dibatalkan.
								</>
							}
							onConfirm={handleConfirmDeletePendaftaranKelas}
							isLoading={pendaftaranKelasMutations.delete.isPending}
							confirmText="Hapus"
							cancelText="Batal"
						/>
					</div>
					<DataTable
						data={dataByKelasId ?? []}
						columns={columnsMurid}
						variant="card"
						toolbar={(table) => {
							const selectedRows = table.getFilteredSelectedRowModel().rows;
							// Hanya tampil jika ada murid yang dipilih dan statusnya WAITING_LIST (opsional filter)
							// Saat ini kita aktifkan semua yang terpilih
							if (selectedRows.length === 0) return null;

							const selectedIds = selectedRows.map((row) => row.original.id);
							// Opsional: Cek apakah ada yang statusnya sudah AKTIF?
							// const hasActive = selectedRows.some(r => r.original.status === 'AKTIF');

							return (
								<div className="flex items-center gap-2">
									<BulkActivateDialog
										selectedIds={selectedIds}
										onSuccess={() => table.resetRowSelection()}
									/>
									<p className="text-muted-foreground text-sm">
										{selectedRows.length} siswa terpilih
									</p>
								</div>
							);
						}}
					/>
				</div>

				{/* GURU */}
				<div className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="min-w-0">
							<h1 className="truncate text-xl font-semibold">
								Riwayat Guru Pengajar
							</h1>
							<p className="text-muted-foreground text-sm">
								Daftar guru yang pernah atau sedang mengajar.
							</p>
						</div>

						<div className="flex flex-wrap gap-2">
							<EditGuruKelas />
							{loadingGuru ? (
								<Skeleton className="h-9 w-32 rounded-md" />
							) : (
								<>
									{/* Only show "Edit Active" if exactly one is active */}
									{activeGuruHistories.length === 1 && (
										<Button variant="outline" onClick={handleOpenEditDrawer}>
											<Edit className="mr-2 h-4 w-4" />
											Edit Guru Aktif
										</Button>
									)}
									{/* Always allow adding more teachers (Double Guru support) */}
									<TambahGuruKelas kelasId={kelasId} />
								</>
							)}
							<DeleteConfirmationDialog
								isOpen={deleteHistoryGuruKelasDialogOpen}
								onOpenChange={setDeleteHistoryGuruKelasDialogOpen}
								title="Hapus History Guru Kelas"
								description={
									<>
										Yakin ingin menghapus History Guru{" "}
										<span className="text-accent font-bold">
											{selectedHistoryGuruKelasToDelete?.namaGuru}
										</span>{" "}
										dari kelas ? Tindakan ini tidak dapat dibatalkan.
									</>
								}
								onConfirm={handleConfirmDeleteGuruKelas}
								isLoading={historyGuruKelasMutations.delete.isPending}
								confirmText="Hapus"
								cancelText="Batal"
							/>
						</div>
					</div>
					<DataTable
						data={dataGuruByKelasId ?? []}
						columns={columnsGuru}
						variant="card"
					/>
				</div>
			</div>
			{/* --- JADWAL KELAS: sekarang full-width, sejajar dengan Murid & Guru --- */}
			<div className="bg-card text-card-foreground rounded-xl border shadow-sm">
				<div className="flex flex-row items-center gap-3 space-y-0 p-6">
					<div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
						<CalendarClock className="h-4 w-4" />
					</div>
					<div>
						<h3 className="leading-none font-semibold tracking-tight">
							Jadwal Kelas
						</h3>
						<p className="text-muted-foreground mt-1.5 text-sm">
							Informasi hari, jam, dan ruang.
						</p>
					</div>
				</div>
				<div className="p-6 pt-0">
					{dataById?.jadwalKelas && dataById.jadwalKelas.length > 0 ? (
						<div className="grid gap-3">
							{dataById.jadwalKelas.map((j) => {
								let timeRange = "-";
								if (j.jamSlotTetap) {
									timeRange = `${j.jamSlotTetap.jamMulai} - ${j.jamSlotTetap.jamSelesai}`;
								} else if (j.jamSlotCustom) {
									timeRange = `${j.jamSlotCustom.jamMulai} - ${j.jamSlotCustom.jamSelesai}`;
								}
								return (
									<div
										key={j.id}
										className="bg-muted/30 border-primary/30 flex flex-wrap items-center justify-between gap-2 rounded-md border border-l-4 p-3 text-sm"
									>
										<div className="flex min-w-0 items-center gap-2 font-medium">
											<CalendarDays className="text-primary h-4 w-4 shrink-0" />
											<span className="truncate">{j.hari}</span>
										</div>
										<div className="text-right">
											<div className="text-foreground font-mono text-xs font-medium whitespace-nowrap">
												{timeRange}
											</div>
											{j.ruang && (
												<div className="text-muted-foreground max-w-[160px] truncate text-xs">
													{j.ruang.namaRuang}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-muted-foreground text-sm italic">
							Belum ada jadwal diatur.
						</p>
					)}
				</div>
			</div>

			<div className="bg-card text-card-foreground rounded-xl border shadow-sm">
				<div className="flex flex-row items-center gap-3 space-y-0 p-6">
					<div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
						<History className="h-4 w-4" />
					</div>
					<div>
						<h3 className="leading-none font-semibold tracking-tight">
							Perjalanan Kelas
						</h3>
						<p className="text-muted-foreground mt-1.5 text-sm">
							Riwayat kenaikan tingkat.
						</p>
					</div>
				</div>
				<div className="p-6 pt-0">
					{dataById?.cohortId ? (
						<ClassHistoryTimeline
							cohortId={dataById.cohortId}
							currentKelasId={kelasId}
						/>
					) : (
						<Skeleton className="h-32 w-full" />
					)}
				</div>
			</div>
		</div>
	);
}
