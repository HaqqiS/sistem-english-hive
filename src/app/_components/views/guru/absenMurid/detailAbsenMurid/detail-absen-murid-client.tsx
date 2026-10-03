"use client";

import { StatusAbsenMurid } from "@prisma/client";
import { Loader2, School, Terminal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/app/_components/shared/data-table-generic"; //
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAbsenMurid } from "@/hooks/useAbsenMurid";
import { formatToWITA } from "@/utils/dateUtils";
import { createDetailAbsenMuridColumns } from "./columns-detail-absen";

export default function DetailAbsenMuridClient() {
	const { sesiId } = useParams<{ sesiId: string }>();
	const router = useRouter();
	const [isBulkUpdating, setIsBulkUpdating] = useState(false);
	const [successState, setSuccessState] = useState<{
		isFinished: boolean;
	} | null>(null);

	const { data, isLoading, isError, error, mutations } = useAbsenMurid({
		sesiId,
		// Sediakan callback kustom untuk toast
		onSuccessCreateOrUpdate: (namaMurid, status) => {
			toast.info(`Absensi ${namaMurid} disimpan sebagai ${status}`);
		},
	});

	// Hitung murid yang belum diabsen
	const unmarkedMuridList = useMemo(() => {
		if (!data?.muridList) return [];
		return data.muridList.filter((m) => !m.status);
	}, [data?.muridList]);

	const isAllMarked = unmarkedMuridList.length === 0;

	// Prevent leaving with unmarked students
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (!isAllMarked && !isLoading) {
				e.preventDefault();
				e.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [isAllMarked, isLoading]);

	// Setelah animasi sukses tampil sebentar, arahkan kembali ke dashboard guru
	useEffect(() => {
		if (!successState) return;
		const timer = setTimeout(() => router.push("/guru"), 2000);
		return () => clearTimeout(timer);
	}, [successState, router]);

	const columns = useMemo(
		() =>
			createDetailAbsenMuridColumns({
				sesiId,
				mutation: mutations.createOrUpdate,
			}),
		[sesiId, mutations.createOrUpdate],
	);

	const handleSelesai = async () => {
		try {
			const result = await mutations.selesaikanAbsen.mutateAsync({ sesiId });

			if (result.isFinished) {
				toast.success("Selamat! Seluruh sesi kelas telah selesai.", {
					description:
						"Daftar pendaftaran dan jadwal otomatis ditutup karena telah mencapai batas sesi.",
				});
			} else {
				toast.success("Sesi absensi selesai.");
			}

			setSuccessState({ isFinished: result.isFinished });
		} catch (e) {
			console.error(e);
		}
	};

	const handleMarkRemainingAsAlpha = async () => {
		if (unmarkedMuridList.length === 0) return;

		setIsBulkUpdating(true);
		try {
			// Loop serentak untuk mempercepat (hati-hati race condition di backend jika ada, tapi aman untuk update row terpisah)
			// Kita batasi concurrency jika perlu, tapi untuk < 50 murid biasanya Promise.all aman.
			const promises = unmarkedMuridList.map((m) =>
				mutations.createOrUpdate.mutateAsync({
					sesiId,
					muridId: m.muridId,
					status: StatusAbsenMurid.ALPA,
				}),
			);

			await Promise.all(promises);
			toast.success(
				`Berhasil menandai ${unmarkedMuridList.length} murid sebagai Alpa.`,
			);
		} catch (error) {
			console.error("Gagal bulk update:", error);
			toast.error("Terjadi kesalahan saat menyimpan data massal.");
		} finally {
			setIsBulkUpdating(false);
		}
	};

	// 3. Tampilkan loading state
	if (isLoading) {
		return (
			<div className="space-y-4 pt-4">
				<header>
					<Skeleton className="h-8 w-1/2" />
					<Skeleton className="mt-2 h-4 w-1/3" />
				</header>
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	// 4. Tampilkan error state
	if (isError) {
		return (
			<Alert variant="destructive">
				<Terminal className="h-4 w-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>
					Gagal memuat data absensi: {error?.message}
				</AlertDescription>
			</Alert>
		);
	}

	// 5. Tampilkan data
	return (
		<div>
			{/* --- STICKY HEADER: Nama Kelas, nempel di atas saat discroll --- */}
			<div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 -mx-4 -mt-4 mb-0 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 backdrop-blur">
				<header className="flex min-w-0 items-start gap-3 sm:items-center">
					<div className="text-primary flex h-11 w-11 shrink-0 items-center justify-center">
						<School className="h-6 w-6" />
					</div>
					<div className="min-w-0">
						<h1 className="flex flex-col text-lg font-semibold leading-tight tracking-tight sm:flex-row sm:flex-wrap sm:gap-x-2">
							{(data?.sesiInfo.kodeKelas ?? "")
								.split("|")
								.map((p) => p.trim())
								.map((part) => (
									<span key={part}>{part}</span>
								))}
						</h1>
						<p className="text-muted-foreground mt-1 text-xs">
							{formatToWITA(
								data?.sesiInfo.tanggalWaktu,
								"dddd, D MMMM YYYY, HH:mm", // Format lengkap
							)}
						</p>
						{data?.sesiInfo.gurus && data.sesiInfo.gurus.length > 0 && (
							<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
								{data.sesiInfo.gurus.map((g) => (
									<span
										key={g.id}
										className={
											g.peran === "ASISTING"
												? "rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700"
												: "border-primary/30 bg-primary/10 text-primary rounded-full border px-2 py-0.5 text-[11px] font-medium"
										}
									>
										{g.name}
										{g.peran === "ASISTING" ? " · Asisting" : ""}
									</span>
								))}
							</div>
						)}
					</div>
				</header>

				{/* Tombol Selesai dengan Dialog Konfirmasi jika belum lengkap */}
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant={isAllMarked ? "default" : "destructive"}
							className="shrink-0 transition-transform active:scale-95"
						>
							{isAllMarked
								? "Simpan & Selesaikan Absen"
								: "Selesai (Belum Lengkap)"}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{isAllMarked ? "Konfirmasi Selesai" : "Absensi Belum Lengkap"}
							</AlertDialogTitle>
							<AlertDialogDescription asChild>
								<div>
									{isAllMarked ? (
										<p>
											Pastikan semua kehadiran murid sudah benar. Anda yakin
											ingin menyelesaikan absensi dan kembali ke menu utama?
										</p>
									) : (
										<div className="space-y-2">
											<p>
												Terdapat <strong>{unmarkedMuridList.length}</strong>{" "}
												murid yang belum diabsen.
											</p>
											<p>
												Murid yang tidak diabsen tidak akan tercatat datanya.
												Anda bisa menandai sisanya sebagai <strong>Alpa</strong>{" "}
												secara otomatis.
											</p>
										</div>
									)}
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className="sm:space-x-2">
							<AlertDialogCancel>Batal</AlertDialogCancel>

							{!isAllMarked && (
								<Button
									variant="outline"
									onClick={(e) => {
										e.preventDefault();
										void handleMarkRemainingAsAlpha();
									}}
									disabled={isBulkUpdating}
								>
									{isBulkUpdating && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Tandai Sebagai Alpa
								</Button>
							)}

							<AlertDialogAction
								onClick={(e) => {
									e.preventDefault();
									void handleSelesai();
								}}
								disabled={
									!isAllMarked ||
									isBulkUpdating ||
									mutations.selesaikanAbsen.isPending
								}
								className={!isAllMarked ? "hidden" : ""}
							>
								{mutations.selesaikanAbsen.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{mutations.selesaikanAbsen.isPending
									? "Menyimpan..."
									: "Ya, Selesaikan"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>

			<div className="mt-4">
				{/* Indikator warning jika belum lengkap */}
				{!isAllMarked && (
					<Alert className="mb-4 border-yellow-500 bg-yellow-50 text-yellow-900">
						<Terminal className="h-4 w-4 stroke-yellow-900" />
						<AlertTitle className="ml-2 font-semibold">Perhatian</AlertTitle>
						<AlertDescription className="ml-2">
							Harap lengkapi absensi untuk semua murid sebelum menyelesaikan
							sesi.
						</AlertDescription>
					</Alert>
				)}

				<DataTable
					columns={columns}
					data={data?.muridList ?? []}
					isLoading={isLoading || isBulkUpdating}
				/>
			</div>

			{/* Animasi sukses setelah absensi disimpan */}
			{successState && (
				<div
					role="status"
					aria-live="polite"
					className="absen-success-overlay bg-background/95 fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 backdrop-blur-sm"
				>
					<svg
						className="absen-success-icon text-primary"
						viewBox="0 0 52 52"
						width="96"
						height="96"
						fill="none"
						aria-hidden="true"
					>
						<circle
							className="absen-success-ring"
							cx="26"
							cy="26"
							r="24"
							stroke="currentColor"
							strokeWidth="2.5"
						/>
						<path
							className="absen-success-check"
							d="M14 27 l8 8 l16 -17"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<div className="absen-success-text text-center">
						<p className="text-xl font-semibold">Absensi Tersimpan!</p>
						<p className="text-muted-foreground mt-1 text-sm">
							{successState.isFinished
								? "Seluruh sesi kelas telah selesai."
								: "Mengalihkan ke dashboard..."}
						</p>
					</div>
				</div>
			)}

			<style>{`
				.absen-success-overlay { animation: absen-fade-in 0.25s ease-out both; }
				.absen-success-icon { animation: absen-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
				.absen-success-ring {
					stroke-dasharray: 151;
					stroke-dashoffset: 151;
					animation: absen-draw 0.6s ease-out 0.1s forwards;
				}
				.absen-success-check {
					stroke-dasharray: 40;
					stroke-dashoffset: 40;
					animation: absen-draw 0.4s ease-out 0.55s forwards;
				}
				.absen-success-text { animation: absen-rise 0.5s ease-out 0.75s both; }
				@keyframes absen-fade-in { from { opacity: 0; } to { opacity: 1; } }
				@keyframes absen-pop { from { transform: scale(0.6); } to { transform: scale(1); } }
				@keyframes absen-draw { to { stroke-dashoffset: 0; } }
				@keyframes absen-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
				@media (prefers-reduced-motion: reduce) {
					.absen-success-overlay, .absen-success-icon, .absen-success-text { animation: none; }
					.absen-success-ring, .absen-success-check { animation: none; stroke-dashoffset: 0; }
				}
			`}</style>
		</div>
	);
}