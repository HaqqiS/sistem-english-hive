"use client";

import { Edit, FileText, History } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";
import { useKelas } from "@/hooks/useKelas";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import {
	useGuruKelasStore,
	usePendaftaranKelasStore,
} from "@/store/useKelasStore";
import { exportAbsensiPDF } from "@/utils/pdfExportUtils";
import { columns as guru } from "../columns/columns-list-guru";
import { columns as murid } from "../columns/columns-list-murid";
import EditGuruKelas from "../drawers/edit-guru-kelas";
import EditMuridDetailKelas from "../drawers/edit-murid";
import TambahGuruKelas from "../drawers/tambah-guru-kelas";
import TambahMuridDetailKelas from "../drawers/tambah-murid";
import { BulkActivateDialog } from "./bulk-activate-dialog";
import { ClassHistoryTimeline } from "./class-history-timeline";

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

	const activeGuruHistory = useMemo(
		() => dataGuruByKelasId?.find((h) => h.statusGuru === "ACTIVE"),
		[dataGuruByKelasId],
	);

	// HANDLERS
	const handleOpenEditDrawer = () => {
		if (activeGuruHistory) {
			openGuruDrawer("edit", activeGuruHistory);
		}
	};

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
		// dataById seharusnya sekarang sudah include jadwalKelas (karena update backend)
		// Namun jika tipe belum update, kita bisa casting atau access safe
		// biome-ignore lint/suspicious/noExplicitAny: Backend baru diupdate
		const jadwalList = (dataById as any).jadwalKelas?.map((j: any) => {
			const slot = j.jamSlotTetap || j.jamSlotCustom;
			if (!slot) return `${j.hari}`;
			return `${j.hari} (${slot.jamMulai} - ${slot.jamSelesai})`;
		});
		const jadwalString = jadwalList?.join(" & ") ?? "-";

		// 1. Siapkan Info Kelas
		const classInfo = {
			kodeKelas: dataById.kodeKelas,
			level: dataById.level,
			grup: dataById.grup,
			bulanTahun: dataById.bulanTahunAjar,
			pengajar: activeGuruHistory?.guru?.name ?? undefined,
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
			console.log("Edit clicked for:", item);
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
	});

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
			<HeaderActionPortal>
				<Button variant="ghost" size="sm" onClick={handleExportAbsensi}>
					<FileText className="mr-2 h-4 w-4" />
					Export PDF Absen
				</Button>
			</HeaderActionPortal>

			{/* --- KOLOM KIRI (UTAMA): Murid & Guru --- */}
			<div className="space-y-8 lg:col-span-2">
				{/* HEADER & MURID */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-semibold">
								Daftar Murid - {dataById?.kodeKelas}
							</h1>
							<p className="text-muted-foreground text-sm">
								Kelola siswa yang terdaftar di kelas ini.
							</p>
						</div>
						<TambahMuridDetailKelas kelasId={kelasId} />
						<EditMuridDetailKelas />
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
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-semibold">Riwayat Guru Pengajar</h1>
							<p className="text-muted-foreground text-sm">
								Daftar guru yang pernah atau sedang mengajar.
							</p>
						</div>

						<div className="flex gap-2">
							<EditGuruKelas />
							{loadingGuru ? (
								<Skeleton className="h-9 w-32 rounded-md" />
							) : activeGuruHistory ? (
								<Button variant="outline" onClick={handleOpenEditDrawer}>
									<Edit className="mr-2 h-4 w-4" />
									Edit Guru Aktif
								</Button>
							) : (
								<TambahGuruKelas kelasId={kelasId} />
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
					<DataTable data={dataGuruByKelasId ?? []} columns={columnsGuru} />
				</div>
			</div>
			{/* --- KOLOM KANAN (SIDEBAR): Class History & Info --- */}
			<div className="space-y-6">
				{/* Mobile Only Trigger for History (Hidden on Desktop) */}
				<div className="lg:hidden">
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="outline" className="w-full">
								<History className="mr-2 h-4 w-4" />
								Lihat Riwayat Perjalanan Kelas
							</Button>
						</SheetTrigger>
						<SheetContent side="bottom" className="h-[80vh]">
							<SheetHeader className="mb-4">
								<SheetTitle>Perjalanan Kelas</SheetTitle>
								<SheetDescription>
									Riwayat kenaikan tingkat dari kelompok belajar ini.
								</SheetDescription>
							</SheetHeader>
							{dataById?.cohortId && (
								<ClassHistoryTimeline
									cohortId={dataById.cohortId}
									currentKelasId={kelasId}
								/>
							)}
						</SheetContent>
					</Sheet>
				</div>

				{/* Desktop View: Always Visible */}
				<div className="bg-card text-card-foreground hidden rounded-xl border shadow-sm lg:block">
					<div className="flex flex-col space-y-1.5 p-6">
						<h3 className="flex items-center gap-2 leading-none font-semibold tracking-tight">
							<History className="text-primary h-4 w-4" />
							Perjalanan Kelas
						</h3>
						<p className="text-muted-foreground text-sm">
							Riwayat kenaikan tingkat.
						</p>
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
		</div>
	);
}
