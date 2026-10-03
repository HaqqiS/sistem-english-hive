"use client";

import { StatusAbsenGuru } from "@prisma/client";
import {
	AlertCircle,
	ArrowLeft,
	CalendarClock,
	Check,
	CheckCircle2,
	ChevronDown,
	ClipboardCheck,
	Clock,
	Copy,
	DoorOpen,
	GraduationCap,
	History,
	KeyRound,
	Loader2,
	MessageCircle,
	Play,
	Replace,
	Search,
	Share2,
	User,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
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
import { usePenggantiGuru } from "@/hooks/usePenggantiGuru";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import type { TypeBuatTokenPenggantiOutput } from "@/types/absenGuru.type";
import type { TypeJadwalHariIniItem } from "@/types/jadwalKelas.type";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";
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

/** "48210937" → "4821 0937" (tampilan input kode pengganti). */
function formatKodeTampil(digits: string): string {
	return digits.length > 4
		? `${digits.slice(0, 4)} ${digits.slice(4)}`
		: digits;
}

export default function GuruDashboardClient() {
	const router = useRouter();
	const { data: session } = useSession();

	// --- State  ---
	const [selectedGuruId, setSelectedGuruId] = useState<string | undefined>(
		undefined,
	);

	const [isGuruPickerOpen, setIsGuruPickerOpen] = useState(false);
	const [guruSearch, setGuruSearch] = useState("");

	const [isConfirmStartOpen, setIsConfirmStartOpen] = useState(false);
	// Kita perlu menyimpan data jadwal sementara sebelum user klik "Ya/Confirm"
	const [pendingStartData, setPendingStartData] = useState<{
		jadwal: TypeJadwalHariIniItem;
	} | null>(null);

	// --- State: alur kode pengganti ---
	// Guru pengganti: kode yang ditempel saat memulai sesi di Mode Guru Pengganti
	const [kodePengganti, setKodePengganti] = useState("");
	// Guru asli: dialog untuk menerbitkan kode pengganti
	const [isBuatKodeOpen, setIsBuatKodeOpen] = useState(false);
	const [jadwalKode, setJadwalKode] = useState<TypeJadwalHariIniItem | null>(
		null,
	);
	const [penggantiId, setPenggantiId] = useState<string | undefined>(undefined);
	const [tanggalKode, setTanggalKode] = useState("");
	const [hasilKode, setHasilKode] =
		useState<TypeBuatTokenPenggantiOutput | null>(null);

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

	const { mutations } = useAbsenGuru({
		onSuccessStartSesi: (newSesiId) => {
			setIsConfirmStartOpen(false);
			setKodePengganti("");
			router.push(`/guru/absen/${newSesiId}`);
		},
	});

	const {
		daftarGuru: daftarGuruPengganti,
		isLoadingDaftarGuru,
		mutations: { buatToken },
	} = usePenggantiGuru({
		enableDaftarGuru: isBuatKodeOpen,
		onSuccessBuatToken: setHasilKode,
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
	const handleMulaiSesiClick = (jadwal: TypeJadwalHariIniItem) => {
		if (isStartingSesi) return;
		setPendingStartData({ jadwal });
		setIsConfirmStartOpen(true);
	};
	const handleConfirmStartSesi = () => {
		if (!pendingStartData) return;

		mulaiSesi({
			jadwalKelasId: pendingStartData.jadwal.jadwalId,
			status: StatusAbsenGuru.HADIR,
			// Di Mode Guru Pengganti, sesi hanya bisa dimulai dengan kode dari guru asli
			tokenPengganti: selectedGuruId ? kodePengganti : undefined,
		});
	};

	// --- Handlers: kode pengganti (sisi guru asli) ---
	const hariIniWita = dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM-DD");
	const batasTanggalKode = dayjs()
		.tz(TIMEZONE_BISNIS)
		.add(7, "day")
		.format("YYYY-MM-DD");

	const openBuatKodeDialog = (jadwal: TypeJadwalHariIniItem) => {
		setJadwalKode(jadwal);
		setPenggantiId(undefined);
		setTanggalKode(hariIniWita);
		setHasilKode(null);
		setIsBuatKodeOpen(true);
	};

	const handleBuatKode = () => {
		if (!jadwalKode || !penggantiId) return;
		buatToken.mutate({
			jadwalKelasId: jadwalKode.jadwalId,
			guruPenggantiId: penggantiId,
			tanggal: tanggalKode || undefined,
		});
	};

	const pesanKode = hasilKode
		? [
				`Kode pengganti kelas ${hasilKode.kodeKelas}`,
				`Tanggal: ${dayjs(hasilKode.tanggal).format("dddd, D MMMM YYYY")}`,
				"",
				`KODE: ${hasilKode.kodeFormat}`,
				"",
				`Cara pakai: buka portal guru → "Guru Pengganti" → pilih ${session?.user.name ?? "nama saya"} → Mulai Sesi → ketik kode 8 digit di atas.`,
				`Kode hanya berlaku untuk akun ${hasilKode.namaGuruPengganti ?? "guru pengganti"} pada tanggal tersebut.`,
			].join("\n")
		: "";

	const handleSalinKode = async () => {
		if (!hasilKode) return;
		try {
			await navigator.clipboard.writeText(hasilKode.kodeFormat);
			toast.success("Kode disalin");
		} catch {
			toast.error("Gagal menyalin. Catat kode yang tampil di layar.");
		}
	};

	const handleKirimWhatsApp = () => {
		window.open(
			`https://wa.me/?text=${encodeURIComponent(pesanKode)}`,
			"_blank",
			"noopener,noreferrer",
		);
	};

	const bisaBagikan =
		typeof navigator !== "undefined" && typeof navigator.share === "function";

	const handleBagikan = async () => {
		try {
			await navigator.share({ text: pesanKode });
		} catch {
			// Dibatalkan oleh pengguna — tidak perlu ditangani
		}
	};

	// --- Render States ---
	if (isLoading) {
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

									{/* Log aktivitas guru pada sesi hari ini */}
									{jadwal.logAktivitas.length > 0 && (
										<details className="group bg-muted/30 rounded-xl border">
											<summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold [&::-webkit-details-marker]:hidden">
												<span className="flex items-center gap-1.5">
													<History className="h-3.5 w-3.5" />
													Log Aktivitas ({jadwal.logAktivitas.length})
												</span>
												<ChevronDown className="text-muted-foreground h-4 w-4 transition-transform group-open:rotate-180" />
											</summary>
											<ol className="space-y-2.5 border-t px-3 py-3">
												{jadwal.logAktivitas.map((log) => (
													<li
														key={log.id}
														className="flex items-start gap-2.5 text-xs"
													>
														<span className="text-muted-foreground w-10 shrink-0 pt-0.5 font-mono">
															{dayjs(log.waktu)
																.tz(TIMEZONE_BISNIS)
																.format("HH:mm")}
														</span>
														<span
															className={cn(
																"mt-1 size-2 shrink-0 rounded-full",
																log.tipe === "SELESAI"
																	? "bg-green-600"
																	: log.tipe === "MULAI"
																		? "bg-primary"
																		: "bg-blue-500",
															)}
														/>
														<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
															{log.tipe === "SELESAI" ? (
																<span className="font-medium text-green-700 dark:text-green-400">
																	Absensi murid diselesaikan
																</span>
															) : (
																<>
																	<span className="font-medium break-words">
																		{log.namaGuru}
																	</span>
																	{log.isPengganti ? (
																		<Badge className="h-4 border-0 bg-orange-100 px-1.5 text-[10px] text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
																			Pengganti
																		</Badge>
																	) : (
																		log.peran === "ASISTING" && (
																			<Badge
																				variant="secondary"
																				className="h-4 px-1.5 text-[10px]"
																			>
																				Asisting
																			</Badge>
																		)
																	)}
																	<span className="text-muted-foreground">
																		{log.tipe === "MULAI"
																			? "memulai sesi"
																			: "bergabung ke sesi"}
																	</span>
																</>
															)}
														</div>
													</li>
												))}
											</ol>
										</details>
									)}
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
											onClick={() => handleMulaiSesiClick(jadwal)}
											disabled={isStartingSesi}
										>
											{isThisItemLoading ? (
												<Loader2 className="mr-2 h-5 w-5 animate-spin" />
											) : (
												<UserPlus className="mr-2 h-5 w-5" />
											)}
											{selectedGuruId
												? "Gabung sebagai Pengganti"
												: "Gabung Sesi (Asisting)"}
										</Button>
									) : (
										<div className="flex w-full flex-col gap-2">
											<Button
												className="h-11 w-full text-base"
												onClick={() => handleMulaiSesiClick(jadwal)}
												disabled={isStartingSesi}
											>
												{isThisItemLoading ? (
													<Loader2 className="mr-2 h-5 w-5 animate-spin" />
												) : (
													<Play className="mr-2 h-5 w-5" />
												)}
												Mulai Sesi
											</Button>
											{!selectedGuruId && (
												<Button
													variant="outline"
													className="h-10 w-full text-sm"
													onClick={() => openBuatKodeDialog(jadwal)}
													disabled={isStartingSesi}
												>
													<KeyRound className="mr-2 h-4 w-4" />
													Buat Kode Pengganti
												</Button>
											)}
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

			<DeleteConfirmationDialog
				isOpen={isConfirmStartOpen && !selectedGuruId}
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
							{pendingStartData?.jadwal.namaRuang})
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

			{/* --- Dialog Mulai/Gabung Sesi sebagai Guru Pengganti (wajib kode) --- */}
			<Dialog
				open={isConfirmStartOpen && !!selectedGuruId}
				onOpenChange={(open) => {
					setIsConfirmStartOpen(open);
					if (!open) setKodePengganti("");
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{pendingStartData?.jadwal.sesiIdSudahDibuat
								? "Gabung Sesi sebagai Pengganti"
								: "Mulai Sesi sebagai Pengganti"}
						</DialogTitle>
						<DialogDescription>
							Kelas{" "}
							<span className="font-bold">
								{pendingStartData?.jadwal.kodeKelas}
							</span>{" "}
							milik <span className="font-bold">{activeGuruName}</span>.
							Masukkan kode 8 digit yang diberikan oleh {activeGuruName}.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-2 py-2">
						<Label htmlFor="kode-pengganti">Kode pengganti (8 digit)</Label>
						<Input
							id="kode-pengganti"
							inputMode="numeric"
							autoComplete="one-time-code"
							value={formatKodeTampil(kodePengganti)}
							onChange={(e) =>
								setKodePengganti(e.target.value.replace(/\D/g, "").slice(0, 8))
							}
							placeholder="0000 0000"
							className="text-center font-mono text-2xl tracking-widest"
						/>
						<p className="text-muted-foreground text-xs">
							Belum punya kode? Minta {activeGuruName} membuka dashboard-nya,
							tekan tombol "Buat Kode Pengganti" di bawah tombol Mulai Sesi pada
							kelas ini. Ruang: {pendingStartData?.jadwal.namaRuang}.
						</p>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setIsConfirmStartOpen(false);
								setKodePengganti("");
							}}
							disabled={isStartingSesi}
						>
							Batal
						</Button>
						<Button
							type="button"
							onClick={handleConfirmStartSesi}
							disabled={isStartingSesi || kodePengganti.length !== 8}
						>
							{isStartingSesi ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Play className="mr-2 h-4 w-4" />
							)}
							{pendingStartData?.jadwal.sesiIdSudahDibuat
								? "Gabung Sesi"
								: "Mulai Sesi"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* --- Dialog Buat Kode Pengganti (sisi guru asli) --- */}
			<Dialog
				open={isBuatKodeOpen}
				onOpenChange={(open) => {
					setIsBuatKodeOpen(open);
					if (!open) setHasilKode(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Buat Kode Pengganti</DialogTitle>
						<DialogDescription>
							Kelas <span className="font-bold">{jadwalKode?.kodeKelas}</span>{" "}
							pukul {jadwalKode?.jamMulai}. Kode hanya berlaku untuk guru
							pengganti yang Anda pilih, pada tanggal yang dipilih.
						</DialogDescription>
					</DialogHeader>

					{hasilKode ? (
						<div className="grid gap-3 py-2">
							<p className="text-sm">
								Kode untuk{" "}
								<span className="font-bold">{hasilKode.namaGuruPengganti}</span>
								, berlaku {dayjs(hasilKode.tanggal).format("dddd, D MMMM YYYY")}{" "}
								(sampai pukul 23.59 WITA).
							</p>
							<p className="bg-muted rounded-xl py-4 text-center font-mono text-4xl font-bold tracking-widest">
								{hasilKode.kodeFormat}
							</p>
							<div className="grid grid-cols-2 gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={handleSalinKode}
								>
									<Copy className="mr-2 h-4 w-4" />
									Salin Kode
								</Button>
								<Button
									type="button"
									className="bg-green-600 text-white hover:bg-green-700"
									onClick={handleKirimWhatsApp}
								>
									<MessageCircle className="mr-2 h-4 w-4" />
									Kirim via WhatsApp
								</Button>
								{bisaBagikan && (
									<Button
										type="button"
										variant="outline"
										className="col-span-2"
										onClick={handleBagikan}
									>
										<Share2 className="mr-2 h-4 w-4" />
										Bagikan ke aplikasi lain
									</Button>
								)}
							</div>
							<p className="text-muted-foreground text-xs">
								Jangan bagikan kode ini ke orang lain selain guru pengganti.
							</p>
						</div>
					) : (
						<div className="grid gap-4 py-2">
							<div className="grid gap-2">
								<Label htmlFor="guru-pengganti-select">Guru pengganti</Label>
								<Select value={penggantiId} onValueChange={setPenggantiId}>
									<SelectTrigger id="guru-pengganti-select">
										<SelectValue
											placeholder={
												isLoadingDaftarGuru
													? "Memuat daftar guru..."
													: "Pilih guru pengganti..."
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{daftarGuruPengganti.map((guru) => (
											<SelectItem key={guru.id} value={guru.id}>
												{guru.name ?? "Tanpa nama"}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="tanggal-kode">Tanggal berlaku</Label>
								<Input
									id="tanggal-kode"
									type="date"
									min={hariIniWita}
									max={batasTanggalKode}
									value={tanggalKode}
									onChange={(e) => setTanggalKode(e.target.value)}
								/>
								<p className="text-muted-foreground text-xs">
									Hari ini sampai 7 hari ke depan.
								</p>
							</div>
						</div>
					)}

					<DialogFooter>
						{hasilKode ? (
							<Button type="button" onClick={() => setIsBuatKodeOpen(false)}>
								Selesai
							</Button>
						) : (
							<Button
								type="button"
								onClick={handleBuatKode}
								disabled={!penggantiId || !tanggalKode || buatToken.isPending}
							>
								{buatToken.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<KeyRound className="mr-2 h-4 w-4" />
								)}
								Buat Kode
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}