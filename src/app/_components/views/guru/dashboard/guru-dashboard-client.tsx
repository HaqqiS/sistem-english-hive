"use client";

import { StatusAbsenGuru } from "@prisma/client";
import {
	AlertCircle,
	ArrowLeft,
	CalendarClock,
	Check,
	CheckCircle2,
	ClipboardCheck,
	Clock,
	DoorOpen,
	Ellipsis,
	GraduationCap,
	Loader2,
	Play,
	Replace,
	Search,
	User,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
	PERTEMUAN_FINAL_TEST,
	PERTEMUAN_MIDDLE_TEST,
} from "@/constants/sesi-event";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { TypeJadwalHariIniItem } from "@/types/jadwalKelas.type";
import dayjs from "@/utils/dateUtils";
import { PengambilanBukuSection } from "../buku/pengambilan-buku-client";
import { MuridPopover } from "./murid-popover";

type SesiState = "belum" | "gabung" | "berjalan" | "selesai";

const SESI_STATE: Record<
	SesiState,
	{ label: string; chip: string; accent: string }
> = {
	belum: {
		label: "Belum dimulai",
		chip: "bg-muted text-muted-foreground",
		accent: "border-l-primary",
	},
	gabung: {
		label: "Perlu gabung",
		chip: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
		accent: "border-l-blue-500",
	},
	berjalan: {
		label: "Absen berjalan",
		chip: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400",
		accent: "border-l-yellow-500",
	},
	selesai: {
		label: "Selesai",
		chip: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
		accent: "border-l-green-600",
	},
};

type EventUjian = {
	label: string;
	icon: typeof GraduationCap;
	banner: string;
	ring: string;
};

/** Event ujian berdasarkan pertemuan ke-berapa yang akan/sedang berlangsung. */
function getEventUjian(pertemuanKe: number): EventUjian | null {
	if (pertemuanKe === PERTEMUAN_MIDDLE_TEST) {
		return {
			label: "MIDDLE TEST",
			icon: ClipboardCheck,
			banner: "bg-violet-600 text-white dark:bg-violet-700",
			ring: "ring-2 ring-violet-500/60",
		};
	}
	if (pertemuanKe === PERTEMUAN_FINAL_TEST) {
		return {
			label: "FINAL TEST",
			icon: GraduationCap,
			banner: "bg-red-600 text-white dark:bg-red-700",
			ring: "ring-2 ring-red-500/60",
		};
	}
	return null;
}

export default function GuruDashboardClient() {
	const router = useRouter();
	const { data: session } = useSession();

	// --- State  ---
	const [isGantiRuangOpen, setIsGantiRuangOpen] = useState(false);
	const [selectedJadwal, setSelectedJadwal] =
		useState<TypeJadwalHariIniItem | null>(null);
	const [overrideRuangId, setOverrideRuangId] = useState<string | undefined>(
		undefined,
	);

	const [selectedGuruId, setSelectedGuruId] = useState<string | undefined>(
		undefined,
	);

	const [isGuruPickerOpen, setIsGuruPickerOpen] = useState(false);
	const [guruSearch, setGuruSearch] = useState("");

	const [isConfirmStartOpen, setIsConfirmStartOpen] = useState(false);
	// Kita perlu menyimpan data jadwal & ruang sementara sebelum user klik "Ya/Confirm"
	const [pendingStartData, setPendingStartData] = useState<{
		jadwal: TypeJadwalHariIniItem;
		ruangId?: string;
	} | null>(null);

	// --- Hooks & Mutations ---
	const { dataGuruList: listGuru, isLoadingGuruList: isLoadingGuru } =
		useUser();

	const {
		dataJadwalHariIni: jadwalHariIni,
		isLoadingJadwalHariIni: isLoading,
		isErrorJadwalHariIni: isError,
		errorJadwalHariIni: error,
	} = useJadwalKelas({
		enableQueryHariIni: true,
		guruId: selectedGuruId, // Pass filter ID ke hook
	});

	const { data: semuaRuangan, isLoading: isLoadingRuangan } =
		api.ruang.getAll.useQuery({});

	const { mutations } = useAbsenGuru({
		onSuccessStartSesi: (newSesiId) => {
			setIsGantiRuangOpen(false);
			setIsConfirmStartOpen(false);
			router.push(`/guru/absen/${newSesiId}`);
		},
	});

	const {
		mutate: mulaiSesi,
		isPending: isStartingSesi,
		variables: startingVars,
	} = mutations.startSesi;

	// --- Helpers ---
	const activeGuruName = selectedGuruId
		? (listGuru?.find((g) => g.id === selectedGuruId)?.name ?? "Guru Lain")
		: "Saya Sendiri";

	const guruLainFiltered = (listGuru ?? []).filter(
		(g) =>
			g.id !== session?.user.id &&
			(g.name ?? "").toLowerCase().includes(guruSearch.trim().toLowerCase()),
	);

	const pilihGuru = (id: string | undefined) => {
		setSelectedGuruId(id);
		setGuruSearch("");
		setIsGuruPickerOpen(false);
	};

	const totalJadwal = jadwalHariIni?.length ?? 0;
	const totalSelesai =
		jadwalHariIni?.filter((j) => j.isAbsenSelesai).length ?? 0;

	// --- Handlers ---
	const handleMulaiSesiClick = (
		jadwal: TypeJadwalHariIniItem,
		ruangId: string | undefined,
	) => {
		if (isStartingSesi) return;
		setPendingStartData({ jadwal, ruangId });
		setIsConfirmStartOpen(true);
	};
	const handleConfirmStartSesi = () => {
		if (!pendingStartData) return;

		mulaiSesi({
			jadwalKelasId: pendingStartData.jadwal.jadwalId,
			status: StatusAbsenGuru.HADIR,
			overrideRuangId: pendingStartData.ruangId,
		});
	};

	const openGantiRuangDialog = (jadwal: TypeJadwalHariIniItem) => {
		setSelectedJadwal(jadwal);
		setOverrideRuangId(jadwal.ruangId);
		setIsGantiRuangOpen(true);
	};

	const handleGantiRuangSubmit = () => {
		if (selectedJadwal) {
			setIsGantiRuangOpen(false);
			handleMulaiSesiClick(selectedJadwal, overrideRuangId);
		}
	};

	// --- Render States ---
	if (isLoading || isLoadingRuangan) {
		return (
			<div className="space-y-6">
				<div className="space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-7 w-48" />
				</div>
				<Skeleton className="h-14 w-full rounded-xl" />
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					<Skeleton className="h-64 w-full rounded-2xl" />
					<Skeleton className="h-64 w-full rounded-2xl" />
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Gagal Memuat Jadwal</AlertTitle>
				<AlertDescription>{error?.message}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="space-y-4">
			{/* --- Judul + ringkasan hari ini --- */}
			<div className="flex items-end justify-between gap-3">
				<div className="min-w-0">
					<p className="text-muted-foreground text-xs">
						{dayjs().format("dddd, D MMMM YYYY")}
					</p>
					<h2 className="text-xl font-bold">Jadwal Hari Ini</h2>
				</div>
				{totalJadwal > 0 && (
					<div className="flex shrink-0 items-center gap-1.5 text-xs">
						<span className="bg-muted rounded-full px-2.5 py-1 font-medium">
							{totalJadwal} kelas
						</span>
						<span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
							{totalSelesai} selesai
						</span>
					</div>
				)}
			</div>

			{/* --- Pilih guru (mode pengganti) --- */}
			{selectedGuruId ? (
				<div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-3 dark:border-orange-900/50 dark:bg-orange-950/20">
					<div className="flex items-center gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200">
							<Users className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-[11px] font-semibold tracking-wide text-orange-700 uppercase dark:text-orange-300">
								Mode Guru Pengganti
							</p>
							<p className="text-base leading-snug font-bold break-words">
								{activeGuruName}
							</p>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<Button
							variant="outline"
							className="bg-background h-10"
							onClick={() => setIsGuruPickerOpen(true)}
						>
							<Replace className="mr-2 h-4 w-4" />
							Ganti Guru
						</Button>
						<Button
							variant="outline"
							className="bg-background h-10"
							onClick={() => setSelectedGuruId(undefined)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Jadwal Saya
						</Button>
					</div>
				</div>
			) : (
				<div className="bg-card flex items-center gap-3 rounded-xl border p-3">
					<div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
						<UserCheck className="size-4" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-muted-foreground text-[11px] leading-none">
							Menampilkan jadwal
						</p>
						<p className="mt-1 truncate text-sm font-semibold">Saya Sendiri</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-9 shrink-0"
						onClick={() => setIsGuruPickerOpen(true)}
						disabled={isLoadingGuru}
					>
						<Users className="mr-1.5 h-4 w-4" />
						Guru Pengganti
					</Button>
				</div>
			)}

			{/* --- Sheet pilih guru (bottom sheet, ramah HP) --- */}
			<Sheet open={isGuruPickerOpen} onOpenChange={setIsGuruPickerOpen}>
				<SheetContent
					side="bottom"
					className="mx-auto flex h-[80vh] max-w-lg flex-col gap-0 rounded-t-2xl p-0"
				>
					<SheetHeader className="space-y-1 border-b p-4 text-left">
						<SheetTitle>Pilih Guru</SheetTitle>
						<SheetDescription>
							Lihat dan kelola jadwal sebagai guru pengganti.
						</SheetDescription>
						<div className="relative pt-2">
							<Search className="text-muted-foreground absolute top-1/2 left-3 mt-1 h-4 w-4 -translate-y-1/2" />
							<Input
								value={guruSearch}
								onChange={(e) => setGuruSearch(e.target.value)}
								placeholder="Cari nama guru..."
								className="h-11 pl-9"
							/>
						</div>
					</SheetHeader>

					<div className="flex-1 space-y-1 overflow-y-auto p-2">
						<button
							type="button"
							onClick={() => pilihGuru(undefined)}
							className={cn(
								"flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors active:bg-muted",
								!selectedGuruId && "bg-primary/10",
							)}
						>
							<div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
								<User className="size-4" />
							</div>
							<span className="flex-1 text-sm font-semibold">
								Jadwal Saya (Default)
							</span>
							{!selectedGuruId && <Check className="text-primary h-4 w-4" />}
						</button>

						<p className="text-muted-foreground px-3 pt-3 pb-1 text-xs font-semibold">
							Guru Lain
						</p>
						{isLoadingGuru ? (
							<div className="flex justify-center py-8">
								<Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
							</div>
						) : guruLainFiltered.length === 0 ? (
							<p className="text-muted-foreground px-3 py-8 text-center text-sm">
								Guru tidak ditemukan.
							</p>
						) : (
							guruLainFiltered.map((guru) => (
								<button
									key={guru.id}
									type="button"
									onClick={() => pilihGuru(guru.id)}
									className={cn(
										"flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors active:bg-muted",
										selectedGuruId === guru.id &&
											"bg-orange-50 dark:bg-orange-950/30",
									)}
								>
									<div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase">
										{guru.name?.charAt(0) ?? "?"}
									</div>
									<span className="flex-1 text-sm font-medium break-words">
										{guru.name}
									</span>
									{selectedGuruId === guru.id && (
										<Check className="h-4 w-4 text-orange-600" />
									)}
								</button>
							))
						)}
					</div>
				</SheetContent>
			</Sheet>

			{/* --- Daftar jadwal --- */}
			{totalJadwal === 0 ? (
				<div className="bg-card flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center">
					<div className="bg-muted rounded-full p-3">
						<CheckCircle2 className="text-muted-foreground h-6 w-6" />
					</div>
					<p className="font-semibold">Jadwal Kosong</p>
					<p className="text-muted-foreground max-w-xs text-sm">
						Tidak ada jadwal mengajar hari ini. Silakan bersantai atau
						persiapkan materi untuk sesi berikutnya.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					{jadwalHariIni?.map((jadwal) => {
						const sudahDimulai = !!jadwal.sesiIdSudahDibuat;
						const sudahGabung = jadwal.sudahBergabungSesiIni;
						const isThisItemLoading =
							isStartingSesi && startingVars?.jadwalKelasId === jadwal.jadwalId;

						const state: SesiState = !sudahDimulai
							? "belum"
							: !sudahGabung
								? "gabung"
								: jadwal.isAbsenSelesai
									? "selesai"
									: "berjalan";
						const meta = SESI_STATE[state];

						// Pertemuan yang akan/sedang berlangsung hari ini. Kalau sesi hari ini
						// sudah dibuat, jumlahSesi sudah termasuk pertemuan ini.
						const pertemuanKe = sudahDimulai
							? jadwal.jumlahSesi
							: jadwal.jumlahSesi + 1;
						const eventUjian = getEventUjian(pertemuanKe);

						return (
							<div
								key={jadwal.jadwalId}
								className={cn(
									"bg-card overflow-hidden rounded-2xl border border-l-4 shadow-sm transition-shadow",
									meta.accent,
									eventUjian?.ring,
									isThisItemLoading && "shadow-md",
								)}
							>
								{selectedGuruId && (
									<div className="flex items-center gap-1.5 bg-orange-50 px-4 py-1.5 text-[11px] font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
										<Users className="h-3 w-3" />
										<span className="truncate">Jadwal {activeGuruName}</span>
									</div>
								)}
								{eventUjian && (
									<div
										className={cn(
											"flex items-center gap-3 px-4 py-3",
											eventUjian.banner,
										)}
									>
										<eventUjian.icon className="h-6 w-6 shrink-0" />
										<div className="min-w-0">
											<p className="text-sm leading-tight font-extrabold tracking-wide">
												EVENT {eventUjian.label}
											</p>
											<p className="text-xs opacity-90">
												Pertemuan ke-{pertemuanKe} kelas ini
											</p>
										</div>
									</div>
								)}
								<div className="space-y-3 p-4">
									{/* Jam + status */}
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2">
											<Clock className="text-muted-foreground h-4 w-4" />
											<p className="font-mono text-lg leading-none font-bold">
												{jadwal.jamMulai}
												<span className="text-muted-foreground font-normal">
													{" "}
													– {jadwal.jamSelesai}
												</span>
											</p>
										</div>
										<span
											className={cn(
												"shrink-0 rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold",
												meta.chip,
											)}
										>
											{meta.label}
										</span>
									</div>

									{/* Kode kelas (tidak dipotong) */}
									<p className="text-primary text-base leading-snug font-semibold break-words">
										{jadwal.kodeKelas}
									</p>

									{/* Info */}
									<div className="space-y-1.5 text-sm">
										<div className="flex items-center gap-2">
											<DoorOpen className="text-muted-foreground h-4 w-4 shrink-0" />
											<span className="font-medium">{jadwal.namaRuang}</span>
										</div>
										{(jadwal.gurus?.length ?? 0) > 0 || jadwal.guru ? (
											<div className="flex items-start gap-2">
												<User className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
												<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
													{jadwal.gurus && jadwal.gurus.length > 0 ? (
														jadwal.gurus.map((g) => (
															<span
																key={g.id}
																className="flex items-center gap-1.5 font-medium"
															>
																{g.name}
																{g.peran === "ASISTING" && (
																	<Badge
																		variant="secondary"
																		className="h-4 px-1.5 text-[10px] font-semibold"
																	>
																		Asisting
																	</Badge>
																)}
															</span>
														))
													) : (
														<span className="font-medium">
															{jadwal.guru?.name}
														</span>
													)}
												</div>
											</div>
										) : null}
									</div>

									{/* Sesi + murid */}
									<div className="flex flex-wrap items-center gap-2">
										<Badge
											variant="secondary"
											className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold"
										>
											<CalendarClock className="h-3.5 w-3.5" />
											{jadwal.jumlahSesi} Sesi
										</Badge>
										<MuridPopover
											kelasId={jadwal.kelasId}
											jumlahMurid={jadwal.jumlahMurid ?? 0}
											className="h-8 rounded-full px-3 text-xs"
										/>
									</div>
								</div>

								{/* Aksi utama */}
								<div className="bg-muted/30 border-t p-3">
									{state === "selesai" ? (
										<Button
											className="h-11 w-full bg-green-600 text-base text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
											onClick={() =>
												router.push(`/guru/absen/${jadwal.sesiIdSudahDibuat}`)
											}
											disabled={isStartingSesi}
										>
											<CheckCircle2 className="mr-2 h-5 w-5" />
											Absen Sudah Selesai
										</Button>
									) : state === "berjalan" ? (
										<Button
											variant="outline"
											className="h-11 w-full border-yellow-500 bg-background text-base text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700 dark:border-yellow-700 dark:text-yellow-500 dark:hover:bg-yellow-950"
											onClick={() =>
												router.push(`/guru/absen/${jadwal.sesiIdSudahDibuat}`)
											}
											disabled={isStartingSesi}
										>
											<Play className="mr-2 h-5 w-5" />
											Lanjutkan Absensi
										</Button>
									) : state === "gabung" ? (
										// Sesi sudah dibuat guru lain — guru ini (mis. asisting)
										// belum tercatat kehadirannya di sesi tsb.
										<Button
											variant="outline"
											className="border-primary/50 text-primary hover:bg-primary/10 bg-background h-11 w-full text-base"
											onClick={() => handleMulaiSesiClick(jadwal, undefined)}
											disabled={isStartingSesi}
										>
											{isThisItemLoading ? (
												<Loader2 className="mr-2 h-5 w-5 animate-spin" />
											) : (
												<UserPlus className="mr-2 h-5 w-5" />
											)}
											Gabung Sesi (Asisting)
										</Button>
									) : (
										<div className="flex w-full items-center gap-2">
											<Button
												className="h-11 flex-1 text-base"
												onClick={() => handleMulaiSesiClick(jadwal, undefined)}
												disabled={isStartingSesi}
											>
												{isThisItemLoading ? (
													<Loader2 className="mr-2 h-5 w-5 animate-spin" />
												) : (
													<Play className="mr-2 h-5 w-5" />
												)}
												Mulai Sesi
											</Button>

											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="bg-background size-11 shrink-0"
														disabled={isStartingSesi}
													>
														<Ellipsis className="h-5 w-5" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														className="py-2.5"
														onClick={() => openGantiRuangDialog(jadwal)}
													>
														<Replace className="mr-2 h-4 w-4" />
														Ganti Ruang & Mulai
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Pengambilan Buku — muncul otomatis kalau ada buku READY untuk kelas guru ini */}
			<PengambilanBukuSection
				guruId={selectedGuruId}
				guruName={activeGuruName}
			/>

			{/* --- Dialog untuk Ganti Ruang --- */}
			<Dialog open={isGantiRuangOpen} onOpenChange={setIsGantiRuangOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ganti Ruang Sesi</DialogTitle>
						<DialogDescription>
							Pilih ruang baru untuk sesi{" "}
							<span className="font-bold">{selectedJadwal?.kodeKelas}</span>{" "}
							pada jam {selectedJadwal?.jamMulai}.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
							<Label htmlFor="ruang-select" className="sm:text-right">
								Ruang Baru
							</Label>
							<div className="sm:col-span-3">
								<Select
									value={overrideRuangId}
									onValueChange={setOverrideRuangId}
								>
									<SelectTrigger id="ruang-select">
										<SelectValue placeholder="Pilih ruang baru..." />
									</SelectTrigger>
									<SelectContent>
										{semuaRuangan?.map((ruang) => (
											<SelectItem key={ruang.id} value={ruang.id}>
												{ruang.namaRuang} (Cabang: {ruang.cabang.namaCabang})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							onClick={handleGantiRuangSubmit}
							disabled={!overrideRuangId || isStartingSesi}
						>
							{isStartingSesi ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Play className="mr-2 h-4 w-4" />
							)}
							Mulai Sesi di Ruang Baru
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DeleteConfirmationDialog
				isOpen={isConfirmStartOpen}
				onOpenChange={setIsConfirmStartOpen}
				title={
					pendingStartData?.jadwal.sesiIdSudahDibuat
						? "Gabung Sesi Kelas"
						: "Mulai Sesi Kelas"
				}
				description={
					<>
						{pendingStartData?.jadwal.sesiIdSudahDibuat
							? "Apakah Anda yakin ingin bergabung sebagai guru asisting pada sesi kelas"
							: "Apakah Anda yakin ingin memulai sesi untuk kelas"}{" "}
						<span className="text-accent font-bold">
							{pendingStartData?.jadwal.kodeKelas}
						</span>
						?
						<br />
						<span className="text-muted-foreground mt-2 block text-xs">
							Pastikan Anda berada di ruangan yang benar (
							{pendingStartData?.ruangId
								? semuaRuangan?.find((r) => r.id === pendingStartData.ruangId)
										?.namaRuang
								: pendingStartData?.jadwal.namaRuang}
							)
						</span>
					</>
				}
				onConfirm={handleConfirmStartSesi}
				isLoading={isStartingSesi}
				confirmText={
					pendingStartData?.jadwal.sesiIdSudahDibuat
						? "Gabung Sesi"
						: "Mulai Sesi"
				}
				cancelText="Batal"
			/>
		</div>
	);
}
