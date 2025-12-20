"use client";

import { StatusAbsenMurid } from "@prisma/client";
import { Loader2, Terminal } from "lucide-react";
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

	const columns = useMemo(
		() =>
			createDetailAbsenMuridColumns({
				sesiId,
				mutation: mutations.createOrUpdate,
			}),
		[sesiId, mutations.createOrUpdate],
	);

	const handleSelesai = () => {
		router.push("/guru/absen");
		toast.success("Sesi absensi selesai.");
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
			<div className="flex items-center justify-between pt-4">
				<header className="flex flex-col gap-1">
					<h1 className="text-xl font-semibold">
						Absensi Kelas: {data?.sesiInfo.kodeKelas}
					</h1>
					<p className="text-muted-foreground text-sm">
						Sesi:{" "}
						{formatToWITA(
							data?.sesiInfo.tanggalWaktu,
							"dddd, D MMMM YYYY, HH:mm", // Format lengkap
						)}
					</p>
				</header>

				{/* Tombol Selesai dengan Dialog Konfirmasi jika belum lengkap */}
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant={isAllMarked ? "default" : "destructive"}>
							{isAllMarked ? "Selesai" : "Selesai (Belum Lengkap)"}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{isAllMarked ? "Konfirmasi Selesai" : "Absensi Belum Lengkap"}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{isAllMarked ? (
									"Semua murid telah diabsen. Anda yakin ingin kembali ke menu utama?"
								) : (
									<div className="space-y-2">
										<p>
											Terdapat <strong>{unmarkedMuridList.length}</strong> murid
											yang belum diabsen.
										</p>
										<p>
											Murid yang tidak diabsen tidak akan tercatat datanya. Anda
											bisa menandai sisanya sebagai <strong>Alpa</strong> secara
											otomatis.
										</p>
									</div>
								)}
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
								onClick={handleSelesai}
								disabled={!isAllMarked || isBulkUpdating}
								className={!isAllMarked ? "hidden" : ""}
							>
								Ya, Selesai
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
		</div>
	);
}
