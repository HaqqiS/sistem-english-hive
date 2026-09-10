"use client";

import { type JenisKelasModel, TipeKelas } from "@prisma/client";
import { AlertCircle, FileSpreadsheet, Filter, RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import { useUser } from "@/hooks/useUser";
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
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const FILTER_STORAGE_KEY = "kelas-list-filters";

	// Baca filter tersimpan di sessionStorage (fallback kalau URL bersih, misal
	// habis klik menu sidebar "Kelas" alih-alih tombol back browser)
	const getStoredFilters = useCallback((): Record<string, string> => {
		if (typeof window === "undefined") return {};
		try {
			const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
			return raw ? (JSON.parse(raw) as Record<string, string>) : {};
		} catch {
			return {};
		}
	}, []);

	const getInitialParam = useCallback(
		(key: string) => {
			return searchParams.get(key) ?? getStoredFilters()[key] ?? null;
		},
		[searchParams, getStoredFilters],
	);

	// Helper: update satu query param + simpan ke sessionStorage, tanpa nambah
	// history & tanpa scroll ke atas
	const setParam = useCallback(
		(key: string, value: string | null) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value === null || value === "ALL" || value === "") {
				params.delete(key);
			} else {
				params.set(key, value);
			}
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });

			const stored = getStoredFilters();
			if (value === null || value === "ALL" || value === "") {
				delete stored[key];
			} else {
				stored[key] = value;
			}
			sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stored));
		},
		[searchParams, pathname, router, getStoredFilters],
	);

	// 1. State Lokal untuk Delete Dialog
	const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
	const [selectedKelasToDelete, setSelectedKelasToDelete] =
		useState<TypeKelasWithSesiPertemuanCount | null>(null);

	// Filter & tab aktif — sumber kebenarannya di URL (dengan fallback ke
	// sessionStorage), jadi tetap ada saat balik dari halaman lain
	const [selectedTipeKelas, setSelectedTipeKelas] = useState<TipeKelas | "ALL">(
		(getInitialParam("tipe") as TipeKelas | "ALL") ?? "ALL",
	);
	const [selectedJenisKelas, setSelectedJenisKelas] = useState<string | "ALL">(
		getInitialParam("jenis") ?? "ALL",
	);
	const [selectedLevelKelas, setSelectedLevelKelas] = useState<number | "ALL">(
		getInitialParam("level") ? Number(getInitialParam("level")) : "ALL",
	);
	const [selectedGuruKelas, setSelectedGuruKelas] = useState<string | "ALL">(
		getInitialParam("guru") ?? "ALL",
	);
	const [activeTab, setActiveTab] = useState(
		getInitialParam("tab") ?? "running",
	);

	// Kalau URL dibuka bersih (tanpa query) tapi ada filter tersimpan di
	// sessionStorage, sinkronkan balik ke URL sekali di awal.
	useEffect(() => {
		if (searchParams.toString() !== "") return;
		const stored = getStoredFilters();
		if (Object.keys(stored).length === 0) return;

		const params = new URLSearchParams(stored);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}, [searchParams, getStoredFilters, pathname, router]);

	const handleChangeTipeKelas = (v: TipeKelas | "ALL") => {
		setSelectedTipeKelas(v);
		setParam("tipe", v === "ALL" ? null : v);
	};
	const handleChangeJenisKelas = (v: string) => {
		setSelectedJenisKelas(v);
		setParam("jenis", v === "ALL" ? null : v);
	};
	const handleChangeLevelKelas = (v: string) => {
		const level = v === "ALL" ? "ALL" : Number(v);
		setSelectedLevelKelas(level);
		setParam("level", v === "ALL" ? null : v);
	};
	const handleChangeGuruKelas = (v: string) => {
		setSelectedGuruKelas(v);
		setParam("guru", v === "ALL" ? null : v);
	};
	const handleChangeTab = (v: string) => {
		setActiveTab(v);
		setParam("tab", v === "running" ? null : v);
	};

	// Restore posisi scroll terakhir (disimpan sebelum klik Detail Kelas / dsb)
	useEffect(() => {
		const saved = sessionStorage.getItem("kelas-list-scroll");
		if (!saved) return;
		sessionStorage.removeItem("kelas-list-scroll");
		requestAnimationFrame(() => {
			window.scrollTo({ top: Number(saved) });
		});
	}, []);

	// 2. Zustand Store Actions
	const { openDrawer: openKelasDrawer } = useKelasStore();
	const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();

	const { data: jenisKelasList } = useJenisKelas();

	const { dataGuruList: guruList } = useUser();

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

		// Level Up
		dataKelasLevelUp,
		isLoadingKelasLevelUp,
		refetchKelasLevelUp,

		// Completed
		dataKelasCompleted,
		isLoadingKelasCompleted,
		refetchKelasCompleted,

		fetchExportData,
		mutations: kelasMutations,
	} = useKelas({
		filterCabang: activeCabangId,
		tipeKelas: selectedTipeKelas,
		jenisKelas: selectedJenisKelas,
		levelKelas: selectedLevelKelas,
		guruId: selectedGuruKelas,
		enableQueryGetKelasCount: true,
		enableQueryGetKelasWaitingCount: true,
		enableQueryGetKelasTrialCount: true,
		enableQueryGetKelasLevelUp: true,
		enableQueryGetKelasCompleted: true,

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

	const isAnyLoading =
		isLoadingKelasCount ||
		isLoadingKelasWaiting ||
		isLoadingKelasTrial ||
		isLoadingKelasLevelUp ||
		isLoadingKelasCompleted;

	const handleRefetchAll = () => {
		refetchKelasCount();
		refetchKelasWaiting();
		refetchKelasTrial();
		refetchKelasLevelUp();
		refetchKelasCompleted();
	};

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
								{isLoadingKelasLevelUp
									? "..."
									: (dataKelasLevelUp?.length ?? 0)}{" "}
								Level Up {" • "}
								{isLoadingKelasCompleted
									? "..."
									: (dataKelasCompleted?.length ?? 0)}{" "}
								Completed {" • "}
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

				{/* Filter bar — 1 baris, scroll horizontal di mobile */}
				<div className="flex items-center gap-2 overflow-x-auto pb-1">
					<Filter className="text-muted-foreground h-4 w-4 shrink-0" />

					<Select
						value={selectedTipeKelas}
						onValueChange={(v) => handleChangeTipeKelas(v as TipeKelas | "ALL")}
					>
						<SelectTrigger className="bg-background h-8 shrink-0 text-sm w-auto min-w-[130px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Tipe</SelectItem>
							{Object.values(TipeKelas).map((tipe) => (
								<SelectItem key={tipe} value={tipe}>
									{tipe.charAt(0).toUpperCase() + tipe.slice(1).toLowerCase()}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={selectedJenisKelas}
						onValueChange={(v) => handleChangeJenisKelas(v)}
					>
						<SelectTrigger className="bg-background h-8 shrink-0 text-sm w-auto min-w-[130px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Jenis</SelectItem>
							{jenisKelasList
								?.filter(
									(jenis, index, self) =>
										index === self.findIndex((t) => t.nama === jenis.nama),
								)
								.map((jenis: JenisKelasModel) => (
									<SelectItem key={jenis.nama} value={jenis.nama}>
										{jenis.nama}
									</SelectItem>
								))}
						</SelectContent>
					</Select>

					<Select
						value={selectedLevelKelas.toString()}
						onValueChange={(v) => handleChangeLevelKelas(v)}
					>
						<SelectTrigger className="bg-background h-8 shrink-0 text-sm w-auto min-w-[110px]">
							<SelectValue placeholder="Semua Level" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Level</SelectItem>
							<SelectItem value="1">Level 1</SelectItem>
							<SelectItem value="2">Level 2</SelectItem>
							<SelectItem value="3">Level 3</SelectItem>
							<SelectItem value="4">Level 4</SelectItem>
						</SelectContent>
					</Select>

					<Select
						value={selectedGuruKelas}
						onValueChange={(v) => handleChangeGuruKelas(v)}
					>
						<SelectTrigger className="bg-background h-8 shrink-0 text-sm w-auto min-w-[130px]">
							<SelectValue placeholder="Semua Guru" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Guru</SelectItem>
							{guruList?.map((guru) => (
								<SelectItem key={guru.id} value={guru.id}>
									{guru.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</header>

			<Tabs value={activeTab} onValueChange={handleChangeTab} className="w-full">
				<TabsList className="mb-2 flex w-full flex-wrap h-auto">
					<TabsTrigger value="running" className="flex-1 min-w-[100px]">
						Running ({dataKelasCount?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="level-up" className="flex-1 min-w-[100px]">
						Level Up ({dataKelasLevelUp?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="trial" className="flex-1 min-w-[100px]">
						Trial ({dataKelasTrial?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="waiting" className="flex-1 min-w-[100px]">
						Waiting ({dataKelasWaiting?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="completed" className="flex-1 min-w-[100px]">
						Completed ({dataKelasCompleted?.length ?? 0})
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
				<TabsContent value="level-up" className="mt-4">
					<KelasListView
						data={dataKelasLevelUp}
						isLoading={isLoadingKelasLevelUp}
						onEditKelas={handleEditClickKelas}
						onEditGuruKelas={handleEditClickGuruKelas}
						onUpLevel={handleUpLevelClick}
						onDelete={handleDeleteClick}
						emptyMessage="Tidak ada kelas yang sedang menunggu level up."
					/>
				</TabsContent>
				<TabsContent value="completed" className="mt-4">
					<KelasListView
						data={dataKelasCompleted}
						isLoading={isLoadingKelasCompleted}
						onEditKelas={handleEditClickKelas}
						onEditGuruKelas={handleEditClickGuruKelas}
						onUpLevel={handleUpLevelClick}
						onDelete={handleDeleteClick}
						emptyMessage="Belum ada kelas berstatus Completed."
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