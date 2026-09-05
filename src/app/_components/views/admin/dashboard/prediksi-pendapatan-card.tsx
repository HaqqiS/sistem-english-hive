"use client";

import { CheckCircle2, TrendingUp, Users, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/useDashboard";
import { toRupiah } from "@/utils/toRupiah";

function warnaAkurasi(persen: number) {
	if (persen >= 90) return "text-emerald-600 bg-emerald-100";
	if (persen >= 70) return "text-amber-600 bg-amber-100";
	return "text-red-600 bg-red-100";
}

export default function PrediksiPendapatanCard() {
	const { prediksiPendapatan, akurasiPrediksi } = useDashboard();
	const { data, isLoading } = prediksiPendapatan;
	const { data: dataAkurasi, isLoading: isLoadingAkurasi } = akurasiPrediksi;

	const totalSiswa =
		(data?.reguler.jumlahSiswa ?? 0) + (data?.privat.jumlahSiswa ?? 0);

	// Rata-rata akurasi dari bulan-bulan yang ada datanya
	const bulanDenganData =
		dataAkurasi?.filter((b) => b.akurasiPersen !== null) ?? [];
	const rataRataAkurasi =
		bulanDenganData.length > 0
			? bulanDenganData.reduce((sum, b) => sum + (b.akurasiPersen ?? 0), 0) /
				bulanDenganData.length
			: null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
					Estimasi Pendapatan Bulan Ini
				</CardTitle>
				<CardDescription>
					Dihitung dari jumlah siswa aktif Reguler & Privat dikali harga
					kelasnya, untuk {data?.bulan ?? "bulan ini"}.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				{isLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-8 w-40" />
						<Skeleton className="h-16 w-full" />
					</div>
				) : !data || totalSiswa === 0 ? (
					<p className="text-muted-foreground text-sm">
						Belum ada siswa aktif di kelas yang berjalan untuk diestimasi.
					</p>
				) : (
					<div className="space-y-4">
						{/* Total estimasi bulan berjalan */}
						<div>
							<p className="text-muted-foreground text-xs uppercase">
								{data.bulan}
							</p>
							<p className="text-2xl font-bold">{toRupiah(data.total)}</p>
							<p className="text-muted-foreground text-xs">
								{totalSiswa} siswa aktif
							</p>
						</div>

						{/* Breakdown Reguler vs Privat */}
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-md border-l-2 border-blue-500 bg-muted/40 p-3">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-[10px] uppercase">
										Reguler
									</span>
									<span className="text-muted-foreground flex items-center gap-1 text-[10px]">
										<Users className="h-3 w-3" />
										{data.reguler.jumlahSiswa}
									</span>
								</div>
								<p className="font-semibold">
									{toRupiah(data.reguler.nominal)}
								</p>
							</div>
							<div className="rounded-md border-l-2 border-amber-500 bg-muted/40 p-3">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-[10px] uppercase">
										Privat
									</span>
									<span className="text-muted-foreground flex items-center gap-1 text-[10px]">
										<Users className="h-3 w-3" />
										{data.privat.jumlahSiswa}
									</span>
								</div>
								<p className="font-semibold">
									{toRupiah(data.privat.nominal)}
								</p>
							</div>
						</div>

						<p className="text-muted-foreground text-[10px]">
							*Estimasi 1 blok tagihan (8x pertemuan) per siswa aktif saat
							ini.
						</p>
					</div>
				)}

				{/* Indikator akurasi prediksi bulan-bulan lalu */}
				<div className="border-t pt-4">
					<div className="mb-2 flex items-center justify-between">
						<p className="text-sm font-medium">Akurasi Prediksi</p>
						{rataRataAkurasi !== null && (
							<span
								className={cn(
									"rounded px-2 py-0.5 text-xs font-semibold",
									warnaAkurasi(rataRataAkurasi),
								)}
							>
								Rata-rata {rataRataAkurasi.toFixed(0)}%
							</span>
						)}
					</div>

					{isLoadingAkurasi ? (
						<Skeleton className="h-16 w-full" />
					) : !dataAkurasi || bulanDenganData.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Belum ada tagihan bulan lalu untuk dibandingkan.
						</p>
					) : (
						<div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
							{dataAkurasi.map((b) => (
								<div
									key={b.bulan}
									className="flex items-center justify-between text-sm"
								>
									<span className="text-muted-foreground">{b.bulan}</span>
									{b.akurasiPersen === null ? (
										<span className="text-muted-foreground text-xs">
											Tidak ada tagihan
										</span>
									) : (
										<span className="flex items-center gap-1.5">
											{b.akurasiPersen >= 90 ? (
												<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
											) : b.akurasiPersen < 70 ? (
												<XCircle className="h-3.5 w-3.5 text-red-600" />
											) : null}
											<span
												className={cn(
													"font-medium",
													b.akurasiPersen >= 90
														? "text-emerald-600"
														: b.akurasiPersen >= 70
															? "text-amber-600"
															: "text-red-600",
												)}
											>
												{b.akurasiPersen}%
											</span>
											<span className="text-muted-foreground text-[10px]">
												({toRupiah(b.totalTerbayar)} /{" "}
												{toRupiah(b.totalTagihan)})
											</span>
										</span>
									)}
								</div>
							))}
						</div>
					)}
					<p className="text-muted-foreground mt-2 text-[10px]">
						Akurasi = total tagihan bulan tsb yang sudah lunas ÷ total
						tagihan yang terjadwal di bulan tsb.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}