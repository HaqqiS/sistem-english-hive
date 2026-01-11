"use client";

import { Hari } from "@prisma/client";
import dayjs from "dayjs";
import {
	AlertCircle,
	CalendarDays,
	FileText,
	Info,
	RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { TypeScheduleMatrixItem } from "@/types/jadwalKelas.type";
import { exportJadwalMatrixPDF } from "@/utils/pdfExportUtils";
import { GuruScheduleCard } from "./guru-schedule-card";

export default function GuruScheduleGrid() {
	// --- STATE ---
	const { activeCabangId } = useGlobalCabangStore();
	// Default hari ini
	const [selectedHari, setSelectedHari] = useState<Hari>(
		(dayjs().format("dddd").toUpperCase() as Hari) in Hari
			? (dayjs().format("dddd").toUpperCase() as Hari)
			: Hari.SENIN,
	);

	// Detect Mobile View
	const isMobile = useIsMobile();

	// --- DATA FETCHING ---
	const {
		dataMatrix,
		isLoadingMatrix: isLoading,
		isRefetchingMatrix: isRefetching,
		isErrorMatrix: isError,
		errorMatrix: error,
		refetchMatrix: refetch,
		fetchScheduleMatrix,
	} = useJadwalKelas({
		filterCabang: activeCabangId,
		hari: selectedHari as Hari,
		enableQueryMatrix: !!activeCabangId,
	});

	// --- LOGIC MATRIKS ---
	const timeSlots = useMemo(() => {
		if (!dataMatrix?.schedules) return [];
		const times = new Set(dataMatrix.schedules.map((s) => s.jamMulai));
		return Array.from(times).sort();
	}, [dataMatrix]);

	const scheduleMap = useMemo(() => {
		if (!dataMatrix?.schedules) return {};
		const map: Record<
			string,
			Record<string, (typeof dataMatrix.schedules)[0]>
		> = {};
		dataMatrix.schedules.forEach((s) => {
			let timeSlot = map[s.jamMulai];
			if (!timeSlot) {
				timeSlot = {};
				map[s.jamMulai] = timeSlot;
			}
			timeSlot[s.ruangId] = s;
		});
		return map;
	}, [dataMatrix]);

	const buildScheduleMap = (schedules: TypeScheduleMatrixItem[]) => {
		const map: Record<string, Record<string, TypeScheduleMatrixItem>> = {};
		schedules.forEach((s) => {
			let timeSlot = map[s.jamMulai];
			if (!timeSlot) {
				timeSlot = {};
				map[s.jamMulai] = timeSlot;
			}
			timeSlot[s.ruangId] = s;
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
				scheduleMap: Record<string, Record<string, TypeScheduleMatrixItem>>;
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

	// --- RENDER ---
	return (
		<div className="flex flex-col gap-4">
			{/* --- FILTERS --- */}
			<div className="flex gap-4 lg:flex-row lg:items-center lg:justify-between">
				{/* 2. REFRESH */}
				<div className="flex items-center gap-2 lg:w-auto">
					<Button
						variant="outline"
						size="icon"
						className="h-9 w-9 shrink-0"
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
				</div>

				{/* 1. FILTER HARI (Responsive) */}
				{isMobile ? (
					// Tampilan Mobile: Dropdown Select
					<div className="w-full">
						<Select
							value={selectedHari}
							onValueChange={(v) => setSelectedHari(v as Hari)}
						>
							<SelectTrigger className="bg-background w-full">
								<div className="flex items-center gap-2">
									<CalendarDays className="text-muted-foreground h-4 w-4" />
									<span className="font-medium">
										<SelectValue />
									</span>
								</div>
							</SelectTrigger>
							<SelectContent>
								{Object.values(Hari).map((hari) => (
									<SelectItem key={hari} value={hari}>
										{hari}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				) : (
					// Tampilan Desktop: Tabs
					<div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
						<Tabs
							value={selectedHari}
							onValueChange={(v) => setSelectedHari(v as Hari)}
						>
							<TabsList className="bg-muted/50 h-9">
								{Object.values(Hari).map((hari) => (
									<TabsTrigger
										key={hari}
										value={hari}
										className="data-[state=active]:bg-background px-3 text-xs data-[state=active]:shadow-sm lg:text-sm"
									>
										{hari}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
					</div>
				)}
			</div>

			{/* --- MAIN GRID AREA --- */}
			<div className="bg-background relative flex flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
				{isLoading ? (
					<div className="space-y-4 p-8">
						<div className="flex gap-4">
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 flex-1" />
						</div>
						{Array.from({ length: 5 }, (_, i) => i).map((id) => (
							<div key={id} className="grid grid-cols-4 gap-4">
								<Skeleton className="h-32 w-full" />
								<Skeleton className="h-32 w-full" />
								<Skeleton className="h-32 w-full" />
								<Skeleton className="h-32 w-full" />
							</div>
						))}
					</div>
				) : isError || !dataMatrix ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
						<div className="rounded-full bg-destructive/10 p-3">
							<AlertCircle className="text-destructive h-6 w-6" />
						</div>
						<div className="space-y-1">
							<h3 className="text-lg font-semibold">Gagal Memuat Jadwal</h3>
							<p className="text-muted-foreground mx-auto max-w-sm text-sm">
								{error?.message ??
									"Gagal memuat data jadwal. Silakan coba lagi."}
							</p>
						</div>
					</div>
				) : dataMatrix.rooms.length === 0 ? (
					<div className="text-muted-foreground bg-muted/5 flex h-[200px] items-center justify-center">
						Belum ada ruangan di cabang ini.
					</div>
				) : timeSlots.length === 0 ? (
					<div className="text-muted-foreground bg-muted/5 flex h-[200px] flex-col items-center justify-center gap-2 p-4">
						<Info className="h-10 w-10 opacity-20" />
						<p>
							Belum ada jadwal pada hari{" "}
							<span className="text-foreground font-bold">{selectedHari}</span>{" "}
							di cabang ini.
						</p>
					</div>
				) : (
					// Area Scroll
					<ScrollArea className="h-full w-full">
						<div className="min-w-max">
							<table className="h-full w-full border-collapse text-sm">
								{/* --- HEADER --- */}
								<thead className="sticky top-0 z-40 shadow-sm">
									<tr>
										{/* Corner Header (Jam/Ruang) */}
										<th className="bg-background text-muted-foreground sticky top-0 left-0 z-50 w-20 border-r border-b p-3 text-center text-xs font-medium">
											<span className="text-[10px] tracking-wider uppercase">
												Waktu
											</span>
										</th>
										{/* Room Headers */}
										{dataMatrix.rooms.map((room) => (
											<th
												key={room.id}
												className="bg-background text-foreground min-w-[250px] border-r border-b p-3 font-semibold"
											>
												{room.namaRuang}
											</th>
										))}
									</tr>
								</thead>

								{/* --- BODY --- */}
								<tbody className="bg-background">
									{timeSlots.map((time, idx) => {
										// Styling zebra striping untuk baris waktu
										const isEven = idx % 2 === 0;
										return (
											<tr
												key={time}
												className={cn(
													"group/row",
													isEven ? "bg-background" : "bg-muted/5",
												)}
											>
												{/* Sticky Time Column */}
												<td
													className={cn(
														"text-foreground sticky left-0 z-30 border-r border-b p-2 text-center align-top font-mono text-sm font-medium",
														isEven ? "bg-background" : "bg-background", // Samakan bg agar tidak transparan saat scroll horizontal
													)}
												>
													<div className="sticky top-12 pt-2">{time}</div>
												</td>

												{/* Cells */}
												{dataMatrix.rooms.map((room) => {
													const schedule = scheduleMap[time]?.[room.id];
													return (
														<td
															key={`${time}-${room.id}`}
															className="h-auto min-h-40 w-[200px] max-w-[200px] min-w-[200px] border-r border-b p-2 align-top"
														>
															{schedule ? (
																<GuruScheduleCard data={schedule} />
															) : (
																// Empty Cell
																<div className="hover:border-muted-foreground/20 h-full w-full rounded-md border border-dashed border-transparent transition-colors" />
															)}
														</td>
													);
												})}
											</tr>
										);
									})}
									{/* Filler Row removed to avoid empty space */}
									<tr className="h-full">
										<td className="bg-background sticky left-0 z-30 border-r"></td>
										{dataMatrix.rooms.map((r) => (
											<td key={r.id} className="border-r"></td>
										))}
									</tr>
								</tbody>
							</table>
						</div>
						<ScrollBar orientation="horizontal" />
						<ScrollBar orientation="vertical" />
					</ScrollArea>
				)}
			</div>
		</div>
	);
}
