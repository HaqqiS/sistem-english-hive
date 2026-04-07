"use client";

import { StatusAbsenGuru } from "@prisma/client";
import {
	AlertCircle,
	CheckCircle2,
	Ellipsis,
	Loader2,
	Play,
	Replace,
	User,
	UserCheck,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { TypeJadwalHariIniItem } from "@/types/jadwalKelas.type";
import { MuridPopover } from "./murid-popover";

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
		onSuccessStartSesi: (newSesiId, isFinished) => {
			setIsGantiRuangOpen(false);
			setIsConfirmStartOpen(false);
			if (isFinished) {
				// SKENARIO A: Tampilkan Alert Dialog "Selamat" sebelum redirect
				// (Kamu perlu buat state dialog baru, misal setIsLevelUpDialogOpen(true))
				toast("Kelas Telah Selesai!", {
					description:
						"Jadwal otomatis dihapus karena kuota pertemuan terpenuhi.",
					// action: {
					//   label: "Lihat Laporan",
					//   onClick: () => router.push(`/guru/laporan-kelas/${newSesiId}`), // Contoh redirect beda
					// },
				});

				// Atau tetap redirect ke absen, tapi bawa query param
				router.push(`/guru/absen/${newSesiId}?status=finished`);
			} else {
				// SKENARIO B: Normal redirect
				router.push(`/guru/absen/${newSesiId}`);
			}
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
				<div className="flex items-center justify-between">
					<Skeleton className="h-10 w-48" />
					<Skeleton className="h-10 w-64" />
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Skeleton className="h-48 w-full" />
					<Skeleton className="h-48 w-full" />
					<Skeleton className="h-48 w-full" />
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
		<div className="space-y-6">
			<div
				className={cn(
					"flex flex-col gap-4 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
					selectedGuruId
						? "border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20"
						: "bg-card",
				)}
			>
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"flex size-10 items-center justify-center rounded-full",
							selectedGuruId
								? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200"
								: "bg-primary/10 text-primary",
						)}
					>
						{selectedGuruId ? (
							<Users className="size-5" />
						) : (
							<UserCheck className="size-5" />
						)}
					</div>
					<div>
						<p className="text-sm font-medium">
							{selectedGuruId ? "Mode Guru Pengganti" : "Jadwal Mengajar Anda"}
						</p>
						<p className="text-muted-foreground text-xs">
							Menampilkan jadwal:{" "}
							<span className="text-foreground font-semibold">
								{activeGuruName}
							</span>
						</p>
					</div>
				</div>

				<div className="flex w-full items-center gap-2 sm:w-auto">
					<Select
						value={selectedGuruId ?? "me"}
						onValueChange={(val) =>
							setSelectedGuruId(val === "me" ? undefined : val)
						}
						disabled={isLoadingGuru}
					>
						<SelectTrigger className="bg-background w-full sm:w-fit sm:min-w-60">
							<SelectValue placeholder="Pilih Guru..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="me">
								<div className="flex items-center gap-2 font-medium">
									<User className="h-4 w-4" />
									Jadwal Saya (Default)
								</div>
							</SelectItem>
							{/* Separator visual jika perlu */}
							<div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
								Guru Lain
							</div>
							{listGuru
								?.filter((guru) => guru.id !== session?.user.id)
								.map((guru) => (
									<SelectItem key={guru.id} value={guru.id}>
										{guru.name}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{!jadwalHariIni ||
					(jadwalHariIni.length === 0 && (
						<Alert
							variant="default"
							className="bg-muted/50 border-muted-foreground/20 col-span-full items-center"
						>
							<CheckCircle2 className="text-accent-foreground h-6 w-6" />
							<AlertTitle>Jadwal Kosong</AlertTitle>
							<AlertDescription>
								tidak ada jadwal mengajar hari ini. Silakan bersantai atau
								persiapkan materi untuk sesi berikutnya.
							</AlertDescription>
						</Alert>
					))}
				{jadwalHariIni?.map((jadwal) => {
					// Cek apakah sesi untuk jadwal ini sudah dibuat
					const sudahDimulai = !!jadwal.sesiIdSudahDibuat;
					const isThisItemLoading =
						isStartingSesi && startingVars?.jadwalKelasId === jadwal.jadwalId;

					return (
						<Card
							key={jadwal.jadwalId}
							className={isThisItemLoading ? "border-primary/50 shadow-md" : ""}
						>
							<CardHeader>
								<CardTitle className="flex items-start justify-between gap-2">
									<span>{`${jadwal.jamMulai} - ${jadwal.jamSelesai}`}</span>
									<MuridPopover
										kelasId={jadwal.kelasId}
										jumlahMurid={jadwal.jumlahMurid ?? 0}
									/>
								</CardTitle>
								<CardDescription className="text-primary font-medium">
									{jadwal.kodeKelas}
								</CardDescription>
								{jadwal.guru && (
									<p className="text-muted-foreground text-sm">
										Pengajar:{" "}
										<span className="text-foreground font-medium">
											{jadwal.gurus && jadwal.gurus.length > 0
												? jadwal.gurus.map((g) => g.name).join(" & ")
												: jadwal.guru.name}
										</span>
									</p>
								)}
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="flex items-center gap-2 text-sm">
									<span className="text-muted-foreground">Ruang:</span>
									<span className="font-medium">{jadwal.namaRuang}</span>
								</p>
							</CardContent>
							<CardFooter className="flex items-center gap-2 pt-0">
								{sudahDimulai ? (
									jadwal.isAbsenSelesai ? (
										<Button
											variant="default"
											className="w-full bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
											onClick={() =>
												router.push(`/guru/absen/${jadwal.sesiIdSudahDibuat}`)
											}
											disabled={isStartingSesi}
										>
											<CheckCircle2 className="mr-2 h-4 w-4" />
											Absen Sudah Selesai
										</Button>
									) : (
										<Button
											variant="outline"
											className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 dark:border-yellow-700 dark:text-yellow-500 dark:hover:bg-yellow-950"
											onClick={() =>
												router.push(`/guru/absen/${jadwal.sesiIdSudahDibuat}`)
											}
											disabled={isStartingSesi}
										>
											<Play className="mr-2 h-4 w-4" />
											Lanjutkan Absensi
										</Button>
									)
								) : (
									<div className="flex w-full items-center gap-2">
										<Button
											className="flex-1"
											onClick={() => handleMulaiSesiClick(jadwal, undefined)}
											disabled={isStartingSesi}
										>
											{isThisItemLoading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Play className="mr-2 h-4 w-4" />
											)}
											Mulai Sesi
										</Button>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="icon"
													className="shrink-0"
													disabled={isStartingSesi}
												>
													<Ellipsis className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => openGantiRuangDialog(jadwal)}
												>
													<Replace className="mr-2 h-4 w-4" />
													Ganti Ruang & Mulai
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								)}
							</CardFooter>
						</Card>
					);
				})}
			</div>

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
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="ruang-select" className="text-right">
								Ruang Baru
							</Label>
							<div className="col-span-3">
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
				title="Mulai Sesi Kelas"
				description={
					<>
						Apakah Anda yakin ingin memulai sesi untuk kelas{" "}
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
				confirmText="Mulai Sesi"
				cancelText="Batal"
			/>
		</div>
	);
}
