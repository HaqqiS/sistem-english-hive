"use client";

import { StatusKelas } from "@prisma/client";
import dayjs from "dayjs";
import { AlertCircle, Download, User } from "lucide-react";
import { useMemo } from "react";
import { utils, writeFile } from "xlsx";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { formatStatus } from "@/utils/statusUtils";

const DAYS = [
	"SENIN",
	"SELASA",
	"RABU",
	"KAMIS",
	"JUMAT",
	"SABTU",
	"MINGGU",
] as const;

interface JadwalGuruTabProps {
	cabangId?: string;
}

const getJadwalGuruStatusTheme = (status?: StatusKelas | null) => {
	switch (status) {
		case StatusKelas.TRIAL:
			return "border-l-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100";
		case StatusKelas.WAITING:
			return "border-l-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100";
		case StatusKelas.LEVEL_UP:
			return "border-l-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-900/20 dark:text-teal-100";
		case StatusKelas.COMPLETED:
			return "border-l-slate-500 bg-slate-50 text-slate-900 dark:bg-slate-900/20 dark:text-slate-100";
		case StatusKelas.RUNNING:
			return "border-l-primary bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary";
		default:
			return "";
	}
};

export default function JadwalGuruTab({ cabangId }: JadwalGuruTabProps) {
	const {
		dataJadwalMatrix: data,
		isLoadingJadwalMatrix: isLoading,
		isErrorJadwalMatrix: isError,
	} = useUser({
		filterCabang: cabangId,
		enableJadwalMatrixQuery: true,
	});

	const processedData = useMemo(() => {
		if (!data) return [];
		const { gurus, jamTetap } = data;

		return gurus.map((guru) => {
			// 1. Collect all custom slots for this guru
			const customSlots = new Map<
				string,
				{ jamMulai: string; jamSelesai: string; isCustom: boolean }
			>();

			// Add standard slots first
			jamTetap.forEach((jt) => {
				const key = `${jt.jamMulai}-${jt.jamSelesai}`;
				if (!customSlots.has(key)) {
					customSlots.set(key, {
						jamMulai: jt.jamMulai,
						jamSelesai: jt.jamSelesai,
						isCustom: false,
					});
				}
			});

			// Add custom slots found in guru's schedule
			guru.historyGuruKelases.forEach((history) => {
				history.kelas.jadwalKelas.forEach((jadwal) => {
					if (jadwal.jamSlotCustom) {
						const { jamMulai, jamSelesai } = jadwal.jamSlotCustom;
						const key = `${jamMulai}-${jamSelesai}`;
						if (!customSlots.has(key)) {
							customSlots.set(key, { jamMulai, jamSelesai, isCustom: true });
						}
					}
				});
			});

			// Sort slots
			const sortedSlots = Array.from(customSlots.values()).sort((a, b) =>
				a.jamMulai.localeCompare(b.jamMulai),
			);

			// Prepare grid data
			const rows = sortedSlots.map((slot) => {
				const dayCells = DAYS.map((day) => {
					// Find class for this slot & day
					const foundClass = guru.historyGuruKelases
						.flatMap((h) =>
							h.kelas.jadwalKelas.map((j) => ({
								...j,
								kodeKelas: h.kelas.kodeKelas,
								statusKelas: h.kelas.statusKelas,
								kelasId: h.kelas.id,
							})),
						)
						.find((j) => {
							// Match Day
							if (j.hari !== day) return false;

							// Match Time
							if (j.jamSlotTetap) {
								return (
									j.jamSlotTetap.jamMulai === slot.jamMulai &&
									j.jamSlotTetap.jamSelesai === slot.jamSelesai
								);
							} else if (j.jamSlotCustom) {
								return (
									j.jamSlotCustom.jamMulai === slot.jamMulai &&
									j.jamSlotCustom.jamSelesai === slot.jamSelesai
								);
							}
							return false;
						});

					return foundClass
						? {
								kodeKelas: foundClass.kodeKelas,
								status: foundClass.statusKelas,
							}
						: null;
				});

				return {
					slot,
					cells: dayCells,
				};
			});

			return {
				guru,
				rows,
			};
		});
	}, [data]);

	// Warna per jam mulai (bukan per jam selesai) — supaya slot dengan jam
	// mulai yang sama terlihat sekelompok meski jam selesainya beda-beda.
	const timeColorMap = useMemo(() => {
		const palette = [
			"bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
			"bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
			"bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
			"bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
			"bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300",
			"bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300",
			"bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
			"bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300",
		];

		const uniqueStarts = Array.from(
			new Set(
				processedData.flatMap((item) =>
					item.rows.map((row) => row.slot.jamMulai),
				),
			),
		).sort();

		const map = new Map<string, string>();
		uniqueStarts.forEach((jamMulai, idx) => {
			map.set(jamMulai, palette[idx % palette.length] ?? "");
		});
		return map;
	}, [processedData]);

	const handleExportExcel = () => {
		if (processedData.length === 0) return;

		const headers = ["Nama Guru", "Jam", ...DAYS];
		const excelData = [headers];

		processedData.forEach((item) => {
			item.rows.forEach((row, index) => {
				const excelRow = [
					index === 0 ? (item.guru.name ?? "Guru") : "", // Guru name in first row
					`${row.slot.jamMulai} - ${row.slot.jamSelesai}`,
					...row.cells.map((cell) =>
						cell ? `${cell.kodeKelas} (${cell.status ?? "-"})` : "-",
					),
				];
				excelData.push(excelRow);
			});
		});

		const worksheet = utils.aoa_to_sheet(excelData);
		const workbook = utils.book_new();
		utils.book_append_sheet(workbook, worksheet, "Jadwal Guru");

		// Auto-size columns (rough implementation)
		const colWidths = excelData[0]?.map((_, i) => ({
			wch: Math.max(...excelData.map((row) => row[i]?.toString().length ?? 10)),
		}));
		worksheet["!cols"] = colWidths;

		const branchName = data?.gurus?.[0]?.cabang?.namaCabang ?? "English_Hive";
		const dateStr = dayjs().format("YYYY-MM-DD");
		const filename = `Jadwal_Guru_${branchName.replace(/\s+/g, "_")}_${dateStr}.xlsx`;

		writeFile(workbook, filename);
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-40 w-full" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-md border bg-background p-8 text-center">
				<div className="rounded-full bg-destructive/10 p-3">
					<AlertCircle className="text-destructive h-6 w-6" />
				</div>
				<div className="space-y-1">
					<h3 className="text-lg font-semibold">Gagal Memuat Jadwal</h3>
					<p className="text-muted-foreground mx-auto max-w-sm text-sm">
						Harap pilih spesifik cabang (bukan "Semua Cabang") untuk melihat
						Kalender Jadwal Guru.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<HeaderActionPortal>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleExportExcel}
					disabled={processedData.length === 0}
					className="flex items-center gap-2"
				>
					<Download className="h-4 w-4" />
					Export Excel
				</Button>
			</HeaderActionPortal>

			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold tracking-tight">
					Grid Jadwal Guru
				</h2>
				<span className="text-muted-foreground text-xs">
					{processedData.length} guru
				</span>
			</div>

			{processedData.length === 0 ? (
				<div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border border-dashed text-sm">
					Tidak ada data jadwal.
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3">
					{processedData.map((item) => {
						const jumlahKelas = item.rows.reduce(
							(sum, row) => sum + row.cells.filter(Boolean).length,
							0,
						);
						return (
							<div
								key={item.guru.id}
								className="bg-background overflow-hidden rounded-lg border shadow-sm"
							>
								{/* Header per guru */}
								<div className="bg-muted/40 flex items-center gap-2.5 border-b px-3 py-2">
									<div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
										<User className="text-primary h-3.5 w-3.5" />
									</div>
									<span className="truncate text-sm font-semibold">
										{item.guru.name ?? "Tanpa nama"}
									</span>
									<Badge
										variant="secondary"
										className="ml-auto shrink-0 text-[10px]"
									>
										{jumlahKelas} kelas
									</Badge>
								</div>

								{/* Tabel compact per guru */}
								<div className="overflow-x-auto">
									<table className="w-full border-collapse text-xs">
										<thead>
											<tr className="bg-muted/20">
												<th className="bg-muted/40 text-muted-foreground sticky left-0 z-10 border-r border-b px-2 py-1.5 text-left font-medium whitespace-nowrap">
													Jam
												</th>
												{DAYS.map((day) => (
													<th
														key={day}
														className="text-muted-foreground min-w-[74px] border-r border-b px-1 py-1.5 text-center font-medium last:border-r-0"
													>
														{day.slice(0, 3)}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{item.rows.length === 0 ? (
												<tr>
													<td
														colSpan={DAYS.length + 1}
														className="text-muted-foreground p-3 text-center text-xs"
													>
														Belum ada jam mengajar
													</td>
												</tr>
											) : (
												item.rows.map((row) => {
													const timeColor =
														timeColorMap.get(row.slot.jamMulai) ?? "";
													return (
														<tr
															key={`${row.slot.jamMulai}-${row.slot.jamSelesai}`}
														>
															<td
																className={cn(
																	"sticky left-0 z-10 border-r border-b px-2 py-1 font-mono font-semibold whitespace-nowrap",
																	timeColor ||
																		"bg-background text-muted-foreground",
																)}
															>
																{row.slot.jamMulai}-{row.slot.jamSelesai}
															</td>
															{row.cells.map((cellContent, dayIdx) => (
																<td
																	key={DAYS[dayIdx]}
																	className="border-r border-b p-1 text-center last:border-r-0"
																>
																	{cellContent ? (
																		<div
																			className={cn(
																				"flex flex-col gap-0 rounded border-l-2 px-1.5 py-1 text-left leading-tight",
																				getJadwalGuruStatusTheme(
																					cellContent.status as StatusKelas,
																				),
																			)}
																			title={formatStatus(
																				cellContent.status as StatusKelas,
																			)}
																		>
																			<span className="truncate text-[11px] font-bold">
																				{cellContent.kodeKelas}
																			</span>
																		</div>
																	) : (
																		<span className="text-muted-foreground/20">
																			-
																		</span>
																	)}
																</td>
															))}
														</tr>
													);
												})
											)}
										</tbody>
									</table>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
