"use client";

import { Hari } from "@prisma/client";
import {
	AlertCircle,
	CalendarDays,
	FileText,
	Info,
	RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { useJadwalKelasStore } from "@/store/useJadwalKelasStore";
import type { TypeScheduleMatrixItem } from "@/types/jadwalKelas.type";
import dayjs from "@/utils/dateUtils";
import { exportJadwalMatrixPDF } from "@/utils/pdfExportUtils";
import EditJadwalKelas from "../edit-jadwal";
import { ScheduleCard } from "./schedule-card";

export default function ScheduleGrid() {
	// --- STATE ---
	const { activeCabangId } = useGlobalCabangStore();
	// Default hari ini
	const [selectedHari, setSelectedHari] = useState<Hari>(
		(dayjs().format("dddd").toUpperCase() as Hari) in Hari
			? (dayjs().format("dddd").toUpperCase() as Hari)
			: Hari.SENIN,
	);

	const { openDrawer } = useJadwalKelasStore();

	// Detect Mobile View
	const isMobile = useIsMobile();

	// State untuk Delete Dialog
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<{
		id: string;
		kode: string;
	} | null>(null);

	// --- DATA FETCHING ---
	const {
		dataMatrix,
		isLoadingMatrix: isLoading,
		isRefetchingMatrix: isRefetching,
		isErrorMatrix: isError,
		errorMatrix: error,
		refetchMatrix: refetch,
		mutations,
		fetchScheduleMatrix,
	} = useJadwalKelas({
		filterCabang: activeCabangId,
		hari: selectedHari as Hari,
		enableQueryMatrix: !!activeCabangId,
		onSuccessDelete: () => {
			setDeleteDialogOpen(false);
			setItemToDelete(null);
		},
	});

	// --- LOGIC MATRIKS ---
	const timeSlots = useMemo(() => {
		if (!dataMatrix?.schedules) return [];
		const times = new Set(dataMatrix.schedules.map((s) => s.jamMulai));
		return Array.from(times).sort();
	}, [dataMatrix]);

	const scheduleMap = useMemo(() => {
		const schedules = dataMatrix?.schedules;
		if (!schedules) return {};
		const map: Record<string, Record<string, (typeof schedules)[0][]>> = {};
		schedules.forEach((s) => {
			const timeSlot = map[s.jamMulai] || {};
			if (!map[s.jamMulai]) {
				map[s.jamMulai] = timeSlot;
			}
			const roomSlot = timeSlot[s.ruangId] || [];
			if (!timeSlot[s.ruangId]) {
				timeSlot[s.ruangId] = roomSlot;
			}
			roomSlot.push(s);
		});
		return map;
	}, [dataMatrix]);

	const handleDelete = (id: string, kode: string) => {
		setItemToDelete({ id, kode });
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		if (itemToDelete) {
			mutations.delete.mutate({ id: itemToDelete.id });
		}
	};

	const buildScheduleMap = (schedules: TypeScheduleMatrixItem[]) => {
		const map: Record<string, Record<string, TypeScheduleMatrixItem[]>> = {};
		schedules.forEach((s) => {
			const timeSlot = map[s.jamMulai] || {};
			if (!map[s.jamMulai]) {
				map[s.jamMulai] = timeSlot;
			}
			const roomSlot = timeSlot[s.ruangId] || [];
			if (!timeSlot[s.ruangId]) {
				timeSlot[s.ruangId] = roomSlot;
			}
			roomSlot.push(s);
		});
		return map;
	};

	const handleExportCurrent = () => {
		if (!dataMatrix || !dataMatrix.schedules.length) {
			toast.error("Tidak ada data jadwal untuk diexport");
			return;
		}

		try {
			exportJadwalMatrixPDF(
				[
					{
						hari: selectedHari as string,
						scheduleMap: scheduleMap,
					},
				],
				dataMatrix.rooms,
				timeSlots,
			);
			toast.success("Berhasil mengunduh jadwal PDF");
		} catch (error) {
			console.error("Export error:", error);
			toast.error("Gagal mengunduh jadwal");
		}
	};

	const handleExportAll = async () => {
		if (!activeCabangId) return;
		const toastId = toast.loading("Mengambil data semua hari...");
		try {
			const data = await fetchScheduleMatrix(activeCabangId);

			if (!data || !data.schedules.length) {
				toast.dismiss(toastId);
				toast.error("Tidak ada data jadwal");
				return;
			}

			// Group by Hari
			const pages: {
				hari: string;
				scheduleMap: Record<string, Record<string, TypeScheduleMatrixItem[]>>;
			}[] = [];
			const daysOrder = Object.values(Hari); // [SENIN, SELASA, ...]

			for (const hari of daysOrder) {
				const schedulesForDay = data.schedules.filter((s) => s.hari === hari);
				if (schedulesForDay.length > 0) {
					// Build Map
					const map = buildScheduleMap(schedulesForDay);
					pages.push({
						hari: hari,
						scheduleMap: map,
					});
				}
			}

			if (pages.length === 0) {
				toast.dismiss(toastId);
				toast.info("Data kosong");
				return;
			}

			// Recalculate TimeSlots for ALL days (union)
			const allTimes = new Set(data.schedules.map((s) => s.jamMulai));
			const sortedTimes = Array.from(allTimes).sort();

			exportJadwalMatrixPDF(pages, data.rooms, sortedTimes);

			toast.dismiss(toastId);
			toast.success("Berhasil export semua hari");
		} catch (err) {
			console.error(err);
			toast.dismiss(toastId);
			toast.error("Gagal export semua hari");
		}
	};

	// --- TURUNAN UNTUK TAMPILAN ---
	const hariIni = (() => {
		const h = dayjs().format("dddd").toUpperCase();
		return h in Hari ? (h as Hari) : null;
	})();

	const namaRuang = useMemo(() => {
		const map: Record<string, string> = {};
		for (const r of dataMatrix?.rooms ?? []) map[r.id] = r.namaRuang;
		return map;
	}, [dataMatrix]);

	// Ruangan yang benar-benar dipakai di hari terpilih (kolom kosong disembunyikan)
	const ruangAktif = useMemo(() => {
		const dipakai = new Set(
			(dataMatrix?.schedules ?? []).map((x) => x.ruangId),
		);
		return (dataMatrix?.rooms ?? []).filter((r) => dipakai.has(r.id));
	}, [dataMatrix]);

	const totalKelas = dataMatrix?.schedules.length ?? 0;

	const jadwalPerJam = useMemo(
		() =>
			timeSlots.map((time) => ({
				time,
				items: (dataMatrix?.schedules ?? []).filter((x) => x.jamMulai === time),
			})),
		[timeSlots, dataMatrix],
	);

	const formatHari = (h: string) => h.charAt(0) + h.slice(1).toLowerCase();

	// Tanggal untuk tiap hari pada minggu berjalan (Senin - Minggu)
	const tanggalHari = (hari: Hari) => {
		const today = dayjs();
		const senin = today.subtract((today.day() + 6) % 7, "day");
		return senin.add(Object.values(Hari).indexOf(hari), "day");
	};

	// --- RENDER ---
	return (
		<div className="flex h-full flex-col gap-4">
			<HeaderActionPortal>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm">
							<FileText className="mr-2 h-4 w-4" />
							Export PDF
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={handleExportCurrent}>
							Export Hari Ini ({selectedHari})
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleExportAll}>
							Export Semua Hari (Full Minggu)
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</HeaderActionPortal>

			{/* --- PILIH HARI --- */}
			<div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
				{Object.values(Hari).map((hari) => {
					const aktif = hari === selectedHari;
					return (
						<button
							key={hari}
							type="button"
							onClick={() => setSelectedHari(hari)}
							className={cn(
								"relative flex shrink-0 flex-col items-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors md:flex-1 md:shrink",
								aktif
									? "bg-primary text-primary-foreground border-primary shadow-sm"
									: "bg-background text-muted-foreground hover:bg-muted",
							)}
						>
							<span>{formatHari(hari)}</span>
							<span
								className={cn(
									"mt-0.5 text-[11px] leading-none font-normal",
									aktif ? "opacity-80" : "text-muted-foreground",
									hari === hariIni && !aktif && "text-primary font-medium",
								)}
							>
								{hari === hariIni
									? "Hari ini"
									: tanggalHari(hari).format("D MMM")}
							</span>
						</button>
					);
				})}
			</div>

			{/* --- RINGKASAN + REFRESH --- */}
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<CalendarDays className="text-muted-foreground h-4 w-4" />
					<h2 className="text-sm font-semibold">
						{formatHari(selectedHari)},{" "}
						{tanggalHari(selectedHari).format("D MMMM")}
					</h2>
					{!isLoading && dataMatrix && (
						<span className="text-muted-foreground text-sm">
							· {totalKelas} kelas
						</span>
					)}
				</div>
				<Button
					variant="outline"
					size="icon"
					className="h-8 w-8 shrink-0"
					disabled={isLoading || isRefetching}
					onClick={() => refetch()}
					title="Refresh Jadwal"
				>
					<RefreshCw
						className={cn(
							"h-4 w-4",
							(isLoading || isRefetching) && "animate-spin",
						)}
					/>
				</Button>
			</div>

			{/* --- ISI JADWAL --- */}
			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 4 }, (_, i) => i).map((id) => (
						<Skeleton key={id} className="h-24 w-full rounded-xl" />
					))}
				</div>
			) : isError || !dataMatrix ? (
				<div className="bg-card flex flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center">
					<div className="bg-destructive/10 rounded-full p-3">
						<AlertCircle className="text-destructive h-6 w-6" />
					</div>
					<div className="space-y-1">
						<h3 className="text-lg font-semibold">Gagal Memuat Jadwal</h3>
						<p className="text-muted-foreground mx-auto max-w-sm text-sm">
							{error?.message ?? "Gagal memuat data jadwal. Silakan coba lagi."}
						</p>
					</div>
				</div>
			) : dataMatrix.rooms.length === 0 ? (
				<div className="text-muted-foreground bg-card flex h-48 items-center justify-center rounded-xl border border-dashed">
					Belum ada ruangan di cabang ini.
				</div>
			) : timeSlots.length === 0 ? (
				<div className="text-muted-foreground bg-card flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center">
					<Info className="h-10 w-10 opacity-20" />
					<p>
						Tidak ada jadwal pada hari{" "}
						<span className="text-foreground font-bold">
							{formatHari(selectedHari)}
						</span>
						.
					</p>
				</div>
			) : isMobile ? (
				// ─── HP: timeline per jam ───
				<div className="flex flex-col gap-5">
					{jadwalPerJam.map(({ time, items }) => (
						<section key={time} className="flex gap-3">
							<div className="flex w-12 shrink-0 flex-col items-center">
								<span className="font-mono text-sm font-bold">{time}</span>
								<span className="bg-border mt-1 w-px flex-1" />
							</div>
							<div className="flex min-w-0 flex-1 flex-col gap-2">
								{items.map((item) => (
									<ScheduleCard
										key={item.id}
										data={item}
										variant="list"
										ruang={namaRuang[item.ruangId]}
										onDelete={handleDelete}
										onEdit={(row) => openDrawer("edit", row)}
									/>
								))}
								{(() => {
									const kosong = dataMatrix.rooms.filter(
										(r) => !(scheduleMap[time]?.[r.id]?.length ?? 0),
									);
									if (kosong.length === 0) return null;
									return (
										<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
											<span className="text-muted-foreground text-xs">
												Ruang kosong:
											</span>
											{kosong.map((r) => (
												<span
													key={r.id}
													className="rounded-full border border-dashed px-2 py-0.5 text-xs text-green-700 dark:text-green-400"
												>
													{r.namaRuang}
												</span>
											))}
										</div>
									);
								})()}
							</div>
						</section>
					))}
				</div>
			) : (
				// ─── PC: matriks waktu x ruangan ───
				<div className="bg-card overflow-hidden rounded-xl border shadow-sm">
					<ScrollArea className="w-full">
						<table className="w-full border-collapse text-sm">
							<thead>
								<tr className="bg-muted/40">
									<th className="bg-muted/40 text-muted-foreground sticky left-0 z-20 w-20 border-r border-b p-3 text-[10px] font-medium tracking-wider uppercase">
										Waktu
									</th>
									{ruangAktif.map((room) => (
										<th
											key={room.id}
											className="min-w-[220px] border-r border-b p-3 text-left text-sm font-semibold last:border-r-0"
										>
											{room.namaRuang}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{timeSlots.map((time) => (
									<tr key={time} className="border-b last:border-b-0">
										<td className="bg-card sticky left-0 z-10 border-r p-3 text-center align-top font-mono text-sm font-semibold">
											{time}
										</td>
										{ruangAktif.map((room) => {
											const schedules = scheduleMap[time]?.[room.id] || [];
											return (
												<td
													key={`${time}-${room.id}`}
													className="border-r p-2 align-top last:border-r-0"
												>
													{schedules.length > 0 && (
														<div className="flex flex-col gap-2">
															{schedules.map((schedule) => (
																<ScheduleCard
																	key={schedule.id}
																	data={schedule}
																	ruang={room.namaRuang}
																	onDelete={handleDelete}
																	onEdit={(row) => openDrawer("edit", row)}
																/>
															))}
														</div>
													)}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			)}

			<EditJadwalKelas />
			<DeleteConfirmationDialog
				isOpen={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				title="Hapus Jadwal"
				description={
					<>
						Yakin ingin menghapus jadwal untuk kelas{" "}
						<span className="text-foreground font-bold">
							{itemToDelete?.kode}
						</span>
						?
					</>
				}
				onConfirm={handleConfirmDelete}
				isLoading={mutations.delete.isPending}
			/>
		</div>
	);
}
