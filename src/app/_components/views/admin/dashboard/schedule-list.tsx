"use client";

import type { StatusKelas } from "@prisma/client";
import {
	Ban,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ClipboardCheck,
	Clock,
	DoorOpen,
	GraduationCap,
	Loader2,
	ShieldCheck,
	User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	PERTEMUAN_FINAL_TEST,
	PERTEMUAN_MIDDLE_TEST,
} from "@/constants/sesi-event";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

type StatusWaktu = "BERLANGSUNG" | "AKAN_DATANG" | "SELESAI";
type EventLabel = "MIDDLE TEST" | "FINAL TEST";

/** Target dialog blokir absensi guru (jadwal yang sedang diatur). */
type BlokirTarget = {
	id: string;
	kode: string;
	guru: string;
	terblokir: boolean;
};

/** Isian cepat untuk catatan; admin tetap bisa mengetik manual. */
const PRESET_CATATAN = ["Murid izin", "Murid izin sakit", "Rescheduled"];

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

	// Blokir absensi guru (khusus hari ini) + catatan manual dari admin
	const utils = api.useUtils();
	const [blokirTarget, setBlokirTarget] = useState<BlokirTarget | null>(null);
	const [catatan, setCatatan] = useState("");
	const tutupDialog = () => {
		setBlokirTarget(null);
		setCatatan("");
	};
	const blokirMutation = api.dashboard.blokirAbsensiGuru.useMutation({
		onSuccess: async () => {
			toast.success("Absensi guru diblokir untuk hari ini");
			await utils.dashboard.getTodaySchedule.invalidate();
			tutupDialog();
		},
		onError: (e) => toast.error(e.message),
	});
	const bukaBlokirMutation = api.dashboard.bukaBlokirAbsensiGuru.useMutation({
		onSuccess: async () => {
			toast.success("Blokir absensi dibuka");
			await utils.dashboard.getTodaySchedule.invalidate();
			tutupDialog();
		},
		onError: (e) => toast.error(e.message),
	});
	const sedangMemproses =
		blokirMutation.isPending || bukaBlokirMutation.isPending;
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
						blokir: j.blokirAbsensi,
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
													{/* Kartu 2 baris: (1) kode kelas + status, (2) ruang & guru ke bawah, lalu tombol blokir di kiri */}
													<div className="space-y-1 px-3 py-2">
														<div className="flex items-start justify-between gap-2">
															<div className="min-w-0">
																<p className="text-sm leading-snug font-semibold break-words">
																	{i.kode}
																</p>
																{i.blokir && (
																	<span className="mt-1 mr-1 inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] leading-none font-extrabold tracking-wide text-white">
																		<Ban className="h-3 w-3" />
																		ABSENSI DIBLOKIR
																	</span>
																)}
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
														<div className="text-muted-foreground flex flex-col gap-0.5 text-xs">
															<span className="flex items-center gap-1.5">
																<DoorOpen className="h-3 w-3 shrink-0" />
																{i.ruang}
															</span>
															<span className="flex items-start gap-1.5">
																<User className="mt-0.5 h-3 w-3 shrink-0" />
																<span className="break-words">{i.guru}</span>
															</span>
														</div>

														{!i.sudahAbsen && (
															<div className="pt-1">
																<button
																	type="button"
																	onClick={() => {
																		setBlokirTarget({
																			id: i.id,
																			kode: i.kode,
																			guru: i.guru,
																			terblokir: !!i.blokir,
																		});
																		setCatatan(i.blokir?.catatan ?? "");
																	}}
																	className={cn(
																		"inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
																		i.blokir
																			? "bg-red-600 text-white hover:bg-red-700"
																			: "bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-300 dark:ring-green-900",
																	)}
																>
																	{i.blokir ? (
																		<ShieldCheck className="h-3.5 w-3.5" />
																	) : (
																		<Ban className="h-3.5 w-3.5" />
																	)}
																	{i.blokir
																		? "Ubah / Buka blokir"
																		: "Blokir absensi"}
																</button>
															</div>
														)}

														{i.blokir && (
															<p className="text-xs break-words text-red-700 dark:text-red-300">
																<span className="font-semibold">Catatan:</span>{" "}
																{i.blokir.catatan}
																<span className="text-muted-foreground">
																	{" "}
																	· {i.blokir.olehNama}
																</span>
															</p>
														)}
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

			{/* Dialog blokir absensi guru (khusus hari ini) */}
			<Dialog
				open={!!blokirTarget}
				onOpenChange={(open) => {
					if (!open && !sedangMemproses) tutupDialog();
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{blokirTarget?.terblokir
								? "Ubah / Buka Blokir Absensi"
								: "Blokir Absensi Guru"}
						</DialogTitle>
						<DialogDescription>
							<span className="font-medium break-words">
								{blokirTarget?.kode}
							</span>
							{blokirTarget?.guru && blokirTarget.guru !== "-"
								? ` · ${blokirTarget.guru}`
								: ""}
							. Guru tidak bisa memulai atau bergabung ke sesi kelas ini sampai
							blokir dibuka. Berlaku hanya hari ini (
							{dayjs().format("D MMMM YYYY")}).
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<div className="flex flex-wrap gap-1.5">
							{PRESET_CATATAN.map((p) => (
								<button
									key={p}
									type="button"
									onClick={() => setCatatan(p)}
									className="bg-muted hover:bg-muted/70 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
								>
									{p}
								</button>
							))}
						</div>
						<Textarea
							value={catatan}
							onChange={(e) => setCatatan(e.target.value)}
							placeholder="Catatan untuk guru, mis. Izin menghadiri acara keluarga"
							maxLength={300}
							rows={3}
						/>
						<p className="text-muted-foreground text-right text-xs">
							{catatan.length}/300
						</p>
					</div>

					<DialogFooter className="gap-2 sm:gap-2">
						{blokirTarget?.terblokir && (
							<Button
								variant="outline"
								disabled={sedangMemproses}
								onClick={() =>
									blokirTarget &&
									bukaBlokirMutation.mutate({ jadwalKelasId: blokirTarget.id })
								}
							>
								{bukaBlokirMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<ShieldCheck className="mr-2 h-4 w-4" />
								)}
								Buka Blokir
							</Button>
						)}
						<Button
							variant="destructive"
							disabled={sedangMemproses || catatan.trim().length < 3}
							onClick={() =>
								blokirTarget &&
								blokirMutation.mutate({
									jadwalKelasId: blokirTarget.id,
									catatan: catatan.trim(),
								})
							}
						>
							{blokirMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Ban className="mr-2 h-4 w-4" />
							)}
							{blokirTarget?.terblokir ? "Simpan Catatan" : "Blokir Absensi"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
