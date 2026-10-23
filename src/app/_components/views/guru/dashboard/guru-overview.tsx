"use client";

import {
	AlertTriangle,
	ArrowLeftRight,
	CalendarCheck,
	CheckCircle2,
	Clock,
	DoorOpen,
	GraduationCap,
	Sparkles,
	Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

const HARI_SINGKAT: Record<string, string> = {
	SENIN: "Mon",
	SELASA: "Tue",
	RABU: "Wed",
	KAMIS: "Thu",
	JUMAT: "Fri",
	SABTU: "Sat",
	MINGGU: "Sun",
};
const URUTAN_HARI = Object.keys(HARI_SINGKAT);

function sapaan() {
	const jam = dayjs().tz(TIMEZONE_BISNIS).hour();
	if (jam < 12) return "Good Morning";
	if (jam < 18) return "Good Afternoon";
	return "Good Evening";
}

/** "Thursday, 22 October 2026" (WITA) */
function tanggalInggris() {
	const parts = new Intl.DateTimeFormat("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: TIMEZONE_BISNIS,
	}).formatToParts(new Date());
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
	return `${get("weekday")}, ${get("day")} ${get("month")} ${get("year")}`;
}

export default function GuruOverview() {
	const { data: session } = useSession();
	const { data, isLoading } = api.absenGuru.getOverviewGuru.useQuery();

	const namaPanjang = session?.user?.name ?? "";

	const statistik = data?.statistik;
	const totalDigantikan = (statistik?.digantikan ?? 0) + (statistik?.izin ?? 0);

	return (
		<div className="space-y-4">
			{/* 1. Sapaan */}
			<div className="from-primary to-primary/80 text-primary-foreground relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-sm">
				<div className="bg-primary-foreground/10 pointer-events-none absolute -top-10 -right-10 size-40 rounded-full" />
				<div className="bg-primary-foreground/10 pointer-events-none absolute -right-2 -bottom-12 size-28 rounded-full" />
				<div className="relative">
					<h2 className="text-xl leading-tight font-bold sm:text-2xl">
						{sapaan()}
						{namaPanjang ? `, ${namaPanjang}` : ""} 👋
					</h2>
					<p className="mt-1 text-sm opacity-90">{tanggalInggris()}</p>
				</div>
			</div>

			{/* 2 & 3. Statistik bulan ini */}
			<div className="grid grid-cols-2 gap-3">
				<StatCard
					icon={CalendarCheck}
					tone="emerald"
					label="Sessions This Month"
					value={statistik?.sesiBulanIni}
					isLoading={isLoading}
					sub="classes you taught"
				/>
				<StatCard
					icon={ArrowLeftRight}
					tone="amber"
					label="Covered / On Leave"
					value={statistik ? totalDigantikan : undefined}
					isLoading={isLoading}
					sub={
						statistik
							? `${statistik.digantikan} covered by others · ${statistik.izin} on leave`
							: ""
					}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				{/* 4. My Active Classes */}
				<section className="bg-card rounded-2xl border p-4 shadow-sm lg:col-span-2">
					<div className="mb-3 flex items-center justify-between gap-2">
						<h3 className="flex items-center gap-2 text-base font-semibold">
							<GraduationCap className="text-primary h-4 w-4" />
							My Active Classes
						</h3>
						{data && (
							<Badge variant="secondary" className="rounded-full">
								{data.kelasAktif.length}
							</Badge>
						)}
					</div>

					{isLoading ? (
						<div className="grid gap-3 md:grid-cols-2">
							<Skeleton className="h-36 rounded-xl" />
							<Skeleton className="h-36 rounded-xl" />
						</div>
					) : !data || data.kelasAktif.length === 0 ? (
						<p className="text-muted-foreground py-6 text-center text-sm">
							You have no active classes right now.
						</p>
					) : (
						<div className="grid gap-3 md:grid-cols-2">
							{data.kelasAktif.map((k) => {
								const jadwal = [...k.jadwal].sort(
									(a, b) =>
										URUTAN_HARI.indexOf(a.hari) - URUTAN_HARI.indexOf(b.hari) ||
										a.jamMulai.localeCompare(b.jamMulai),
								);
								return (
									<div
										key={k.id}
										className="bg-background space-y-2.5 rounded-xl border p-3"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 space-y-1.5">
												<p className="text-sm leading-snug font-semibold break-words">
													{k.kodeKelas}
												</p>
												{(k.peran === "ASISTING" ||
													k.statusKelas === "TRIAL") && (
													<div className="flex flex-wrap gap-1.5">
														{k.peran === "ASISTING" && (
															<Badge
																variant="outline"
																className="h-5 px-1.5 text-[10px]"
															>
																Assistant
															</Badge>
														)}
														{k.statusKelas === "TRIAL" && (
															<Badge className="h-5 border-0 bg-sky-100 px-1.5 text-[10px] text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
																Trial
															</Badge>
														)}
													</div>
												)}
											</div>
											<span className="bg-muted flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
												<Users className="h-3.5 w-3.5" />
												{k.jumlahSiswa}
											</span>
										</div>

										<div className="text-muted-foreground space-y-1 text-xs">
											{jadwal.length === 0 ? (
												<p>No schedule yet</p>
											) : (
												jadwal.map((j) => (
													<p
														key={`${j.hari}-${j.jamMulai}-${j.ruang}`}
														className="flex flex-wrap items-center gap-x-2 gap-y-0.5"
													>
														<span className="text-foreground w-8 font-semibold">
															{HARI_SINGKAT[j.hari] ?? j.hari}
														</span>
														<span className="flex items-center gap-1 font-mono">
															<Clock className="h-3 w-3" />
															{j.jamMulai}
															{j.jamSelesai ? ` - ${j.jamSelesai}` : ""}
														</span>
														<span className="flex items-center gap-1">
															<DoorOpen className="h-3 w-3" />
															{j.ruang}
														</span>
													</p>
												))
											)}
										</div>

										{k.siswaBaru.length > 0 && (
											<div className="flex items-start gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
												<Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
												<span className="break-words">
													<span className="font-semibold">New student:</span>{" "}
													{k.siswaBaru.join(", ")}
													<span className="block opacity-80">
														Never marked present or absent in this class yet
													</span>
												</span>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</section>

				{/* 5. Students to Follow Up */}
				<section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
					<div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
						<AlertTriangle className="h-4 w-4 text-amber-600" />
						<h3 className="text-base font-semibold">Students to Follow Up</h3>
					</div>
					<div className="p-4">
						{isLoading ? (
							<div className="space-y-2">
								<Skeleton className="h-10 rounded-lg" />
								<Skeleton className="h-10 rounded-lg" />
							</div>
						) : !data || data.perluTindakLanjut.length === 0 ? (
							<div className="flex flex-col items-center gap-2 py-6 text-center">
								<CheckCircle2 className="h-6 w-6 text-green-600" />
								<p className="text-muted-foreground text-sm">
									All good. No student needs a follow-up.
								</p>
							</div>
						) : (
							<>
								<ul className="space-y-2">
									{data.perluTindakLanjut.map((s) => (
										<li
											key={`${s.muridId}-${s.kodeKelas}`}
											className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
										>
											<div className="min-w-0">
												<p className="text-sm font-semibold break-words">
													{s.nama}
												</p>
												<p className="text-muted-foreground text-[11px] break-words">
													{s.kodeKelas}
												</p>
											</div>
											<span
												className={cn(
													"shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
													s.jumlahAlpa >= 3
														? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
														: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
												)}
											>
												absent {s.jumlahAlpa} times
											</span>
										</li>
									))}
								</ul>
								<p className="text-muted-foreground mt-3 text-[11px]">
									Counted from the last {data.jendelaSesi} sessions of each
									class.
								</p>
							</>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}

type Tone = "emerald" | "amber";

const TONE: Record<Tone, { tile: string; accent: string }> = {
	emerald: {
		tile: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
		accent: "from-emerald-500/10",
	},
	amber: {
		tile: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
		accent: "from-amber-500/10",
	},
};

function StatCard({
	icon: Icon,
	tone,
	label,
	value,
	sub,
	isLoading,
}: {
	icon: typeof CalendarCheck;
	tone: Tone;
	label: string;
	value: number | undefined;
	sub: string;
	isLoading: boolean;
}) {
	return (
		<div
			className={cn(
				"bg-card relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent p-4 shadow-sm",
				TONE[tone].accent,
			)}
		>
			<div
				className={cn(
					"mb-3 flex size-9 items-center justify-center rounded-xl",
					TONE[tone].tile,
				)}
			>
				<Icon className="h-5 w-5" />
			</div>
			{isLoading ? (
				<Skeleton className="h-8 w-12" />
			) : (
				<p className="text-3xl leading-none font-bold">{value ?? 0}</p>
			)}
			<p className="mt-1.5 text-sm font-medium">{label}</p>
			<p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
				{sub}
			</p>
		</div>
	);
}
