"use client";

import type { StatusKelas } from "@prisma/client";
import {
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ClipboardCheck,
	Clock,
	DoorOpen,
	GraduationCap,
	User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	PERTEMUAN_FINAL_TEST,
	PERTEMUAN_MIDDLE_TEST,
} from "@/constants/sesi-event";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

type StatusWaktu = "BERLANGSUNG" | "AKAN_DATANG" | "SELESAI";
type EventLabel = "MIDDLE TEST" | "FINAL TEST";

/** Warna pinggir kartu mengikuti status kelas (sama dengan warna badge status kelas). */
const BORDER_STATUS_KELAS: Record<StatusKelas, string> = {
	RUNNING: "border-l-(--badge-running-bg)",
	TRIAL: "border-l-(--badge-trial-bg)",
	WAITING: "border-l-(--badge-waiting-bg)",
	LEVEL_UP: "border-l-(--badge-level-up-bg)",
	COMPLETED: "border-l-(--badge-completed-bg)",
};

/** Event ujian berdasarkan pertemuan ke-berapa yang berlangsung hari ini. */
function getEventUjian(pertemuanKe: number) {
	if (pertemuanKe === PERTEMUAN_MIDDLE_TEST) {
		return {
			label: "MIDDLE TEST",
			icon: ClipboardCheck,
			// Warna kartu + badge penanda langsung di kartu kelas
			card: "bg-violet-50 ring-2 ring-violet-500/60 dark:bg-violet-950/30",
			badge: "bg-violet-600 text-white dark:bg-violet-700",
		};
	}
	if (pertemuanKe === PERTEMUAN_FINAL_TEST) {
		return {
			label: "FINAL TEST",
			icon: GraduationCap,
			card: "bg-red-50 ring-2 ring-red-500/60 dark:bg-red-950/30",
			badge: "bg-red-600 text-white dark:bg-red-700",
		};
	}
	return null;
}

const jamSekarang = () => dayjs().tz(TIMEZONE_BISNIS).format("HH:mm");

export default function ScheduleList() {
	const { todaySchedule } = useDashboard();
	const { data, isLoading } = todaySchedule;

	// Perbarui status berlangsung/selesai tiap menit
	const [now, setNow] = useState(jamSekarang);
	const [tampilSelesai, setTampilSelesai] = useState(false);
	// Filter cepat: hanya tampilkan kelas yang sedang ada event test tertentu
	const [filterEvent, setFilterEvent] = useState<EventLabel | null>(null);
	useEffect(() => {
		const t = setInterval(() => setNow(jamSekarang()), 60_000);
		return () => clearInterval(t);
	}, []);

	const items = useMemo(
		() =>
			(data ?? [])
				.map((j) => {
					const mulai =
						j.jamSlotTetap?.jamMulai ?? j.jamSlotCustom?.jamMulai ?? "-";
					const selesai =
						j.jamSlotTetap?.jamSelesai ?? j.jamSlotCustom?.jamSelesai ?? null;
					const sudahAbsen = j.sesiPertemuanKelases.some(
						(sesi) => sesi.isSelesaiAbsen,
					);
					const status: StatusWaktu =
						mulai === "-"
							? "AKAN_DATANG"
							: selesai && now > selesai
								? "SELESAI"
								: now >= mulai
									? "BERLANGSUNG"
									: "AKAN_DATANG";
					const guru =
						j.kelas.historyGuruKelases.length > 0
							? j.kelas.historyGuruKelases.map((h) => h.guru.name).join(" & ")
							: "-";
					// Pertemuan hari ini: kalau sesi hari ini sudah dibuat, jumlah sesi sudah
					// termasuk pertemuan ini; kalau belum, pertemuan berikutnya = jumlah + 1.
					const sudahAdaSesiHariIni = j.sesiPertemuanKelases.length > 0;
					const pertemuanKe = sudahAdaSesiHariIni
						? j.kelas._count.sesiPertemuanKelases
						: j.kelas._count.sesiPertemuanKelases + 1;
					return {
						id: j.id,
						pertemuanKe,
						eventUjian: getEventUjian(pertemuanKe),
						kode: j.kelas.kodeKelas,
						statusKelas: j.kelas.statusKelas,
						ruang: j.ruang.namaRuang,
						mulai,
						selesai,
						sudahAbsen,
						status,
						guru,
					};
				})
				// Urut kronologis supaya sekat per jam berurutan
				.sort((a, b) => a.mulai.localeCompare(b.mulai)),
		[data, now],
	);

	const totalSudahAbsen = items.filter((i) => i.sudahAbsen).length;
	const totalMiddle = items.filter(
		(i) => i.eventUjian?.label === "MIDDLE TEST",
	).length;
	const totalFinal = items.filter(
		(i) => i.eventUjian?.label === "FINAL TEST",
	).length;
	const berikutnyaId = items.find((i) => i.status === "AKAN_DATANG")?.id;

	// Kelas yang sudah lewat disembunyikan dulu supaya yang penting langsung terlihat
	const jumlahSelesai = items.filter((i) => i.status === "SELESAI").length;
	const tampil = filterEvent
		? items.filter((i) => i.eventUjian?.label === filterEvent)
		: tampilSelesai
			? items
			: items.filter((i) => i.status !== "SELESAI");

	// Kelompokkan per jam mulai (sekat pembatas tiap jam yang berbeda)
	const grupJam = useMemo(() => {
		const map = new Map<string, typeof tampil>();
		for (const item of tampil) {
			const arr = map.get(item.mulai) ?? [];
			arr.push(item);
			map.set(item.mulai, arr);
		}
		return Array.from(map.entries());
	}, [tampil]);

	return (
		<Card className="gap-3 py-4">
			<CardHeader className="px-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="min-w-0">
						<CardTitle className="flex items-center gap-2 text-base">
							<CalendarDays className="text-muted-foreground h-4 w-4" />
							Jadwal Hari Ini
						</CardTitle>
						<p className="text-muted-foreground mt-0.5 text-xs">
							{dayjs().format("dddd, D MMMM YYYY")}
						</p>
					</div>
					{!isLoading && items.length > 0 && (
						<div className="flex items-center gap-1.5 text-xs">
							<span className="bg-muted rounded-full px-2.5 py-1 font-medium">
								{items.length} kelas
							</span>
							<span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
								{totalSudahAbsen} sudah absen
							</span>
							{(
								[
									{
										label: "MIDDLE TEST",
										nama: "Middle Test",
										jumlah: totalMiddle,
										aktif: "bg-violet-600 text-white",
										pasif:
											"bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950/50 dark:text-violet-300",
									},
									{
										label: "FINAL TEST",
										nama: "Final Test",
										jumlah: totalFinal,
										aktif: "bg-red-600 text-white",
										pasif:
											"bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300",
									},
								] as const
							)
								.filter((e) => e.jumlah > 0)
								.map((e) => (
									<button
										key={e.label}
										type="button"
										aria-pressed={filterEvent === e.label}
										title={`Tampilkan hanya kelas ${e.nama}`}
										onClick={() =>
											setFilterEvent((cur) =>
												cur === e.label ? null : e.label,
											)
										}
										className={cn(
											"rounded-full px-2.5 py-1 font-medium transition-colors",
											filterEvent === e.label ? e.aktif : e.pasif,
										)}
									>
										{e.nama} {e.jumlah}
									</button>
								))}
						</div>
					)}
				</div>
			</CardHeader>

			<CardContent className="px-4">
				{isLoading ? (
					<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
						{[1, 2, 3].map((id) => (
							<Skeleton key={id} className="h-[72px] w-full rounded-xl" />
						))}
					</div>
				) : items.length === 0 ? (
					<p className="text-muted-foreground py-4 text-center text-sm">
						Tidak ada jadwal kelas hari ini.
					</p>
				) : (
					<div className="space-y-4">
						{filterEvent && (
							<div className="bg-muted/50 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs">
								<span>
									Menampilkan kelas dengan{" "}
									<span className="font-semibold">EVENT {filterEvent}</span>{" "}
									hari ini
								</span>
								<button
									type="button"
									onClick={() => setFilterEvent(null)}
									className="text-primary font-medium hover:underline"
								>
									Tampilkan semua
								</button>
							</div>
						)}

						{!filterEvent && jumlahSelesai > 0 && (
							<button
								type="button"
								onClick={() => setTampilSelesai((v) => !v)}
								className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors"
							>
								{tampilSelesai
									? "Sembunyikan kelas yang sudah selesai"
									: `Tampilkan ${jumlahSelesai} kelas yang sudah selesai`}
								<ChevronDown
									className={cn(
										"h-3.5 w-3.5 transition-transform",
										tampilSelesai && "rotate-180",
									)}
								/>
							</button>
						)}

						{grupJam.length === 0 && (
							<p className="text-muted-foreground py-3 text-center text-sm">
								Semua kelas hari ini sudah selesai.
							</p>
						)}

						{grupJam.map(([jam, daftar]) => {
							const sedangBerlangsung = daftar.some(
								(d) => d.status === "BERLANGSUNG",
							);
							return (
								<section key={jam} className="space-y-2">
									{/* Sekat pembatas per jam */}
									<div className="flex items-center gap-3">
										<span
											className={cn(
												"flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold",
												sedangBerlangsung
													? "bg-primary text-primary-foreground"
													: "bg-muted text-foreground",
											)}
										>
											{sedangBerlangsung && (
												<span className="size-1.5 animate-pulse rounded-full bg-current" />
											)}
											{jam}
										</span>
										<span className="bg-border h-px flex-1" />
										<span className="text-muted-foreground text-xs">
											{daftar.length} kelas
										</span>
									</div>

									<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
										{daftar.map((i) => {
											const belumAbsen =
												i.status === "SELESAI" && !i.sudahAbsen;
											return (
												<div
													key={i.id}
													className={cn(
														"overflow-hidden rounded-xl border border-l-4 shadow-xs",
														i.eventUjian ? i.eventUjian.card : "bg-card",
														i.statusKelas
															? BORDER_STATUS_KELAS[i.statusKelas]
															: "border-l-border",
														i.status === "SELESAI" &&
															i.sudahAbsen &&
															"opacity-75",
													)}
												>
													{/* Kartu 2 baris: (1) kode kelas + status, (2) jam · ruang · guru */}
													<div className="space-y-1 px-3 py-2">
														<div className="flex items-start justify-between gap-2">
															<div className="min-w-0">
																<p className="text-sm leading-snug font-semibold break-words">
																	{i.kode}
																</p>
																{i.eventUjian && (
																	<span
																		title={`Pertemuan ke-${i.pertemuanKe}`}
																		className={cn(
																			"mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-none font-extrabold tracking-wide",
																			i.eventUjian.badge,
																		)}
																	>
																		<i.eventUjian.icon className="h-3 w-3" />
																		{i.eventUjian.label} · P{i.pertemuanKe}
																	</span>
																)}
															</div>
															{i.status === "BERLANGSUNG" ? (
																<Badge className="h-5 shrink-0 gap-1 px-1.5 text-[10px]">
																	<span className="size-1.5 animate-pulse rounded-full bg-current" />
																	Berlangsung
																</Badge>
															) : i.sudahAbsen ? (
																<Badge className="h-5 shrink-0 gap-1 border-0 bg-green-100 px-1.5 text-[10px] text-green-700 dark:bg-green-950/50 dark:text-green-300">
																	<CheckCircle2 className="h-3 w-3" />
																	Sudah Absen
																</Badge>
															) : belumAbsen ? (
																<Badge className="h-5 shrink-0 border-0 bg-amber-100 px-1.5 text-[10px] text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
																	Belum Absen
																</Badge>
															) : i.id === berikutnyaId ? (
																<Badge
																	variant="outline"
																	className="h-5 shrink-0 gap-1 border-blue-300 px-1.5 text-[10px] text-blue-600 dark:text-blue-300"
																>
																	<Clock className="h-3 w-3" />
																	Berikutnya
																</Badge>
															) : null}
														</div>
														<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
															<span className="flex items-center gap-1 font-mono">
																<Clock className="h-3 w-3 shrink-0" />
																{i.mulai}
																{i.selesai ? ` - ${i.selesai}` : ""}
															</span>
															<span className="flex items-center gap-1">
																<DoorOpen className="h-3 w-3 shrink-0" />
																{i.ruang}
															</span>
															<span className="flex items-center gap-1">
																<User className="h-3 w-3 shrink-0" />
																<span className="break-words">{i.guru}</span>
															</span>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</section>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
