"use client";

import { TrendingUp, Users } from "lucide-react";
import {
	Bar,
	CartesianGrid,
	ComposedChart,
	Line,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import { toRupiah } from "@/utils/toRupiah";

function warnaAkurasi(persen: number) {
	if (persen >= 90) return "text-emerald-600 bg-emerald-100";
	if (persen >= 70) return "text-amber-600 bg-amber-100";
	return "text-red-600 bg-red-100";
}

const chartConfig = {
	totalTagihan: {
		label: "Tagihan Terjadwal",
		color: "#93c5fd", // Blue muda
	},
	totalTerbayar: {
		label: "Sudah Lunas",
		color: "#3b82f6", // Blue tua
	},
	akurasiPersen: {
		label: "Akurasi (%)",
		color: "#f59e0b", // Amber
	},
} satisfies ChartConfig;

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

	// Data untuk chart: pakai label bulan singkat (3 huruf pertama) biar muat
	const chartData =
		dataAkurasi?.map((b) => ({
			...b,
			bulanSingkat: b.bulan.split(" ")[0],
		})) ?? [];

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
								<p className="font-semibold">{toRupiah(data.privat.nominal)}</p>
							</div>
						</div>

						<p className="text-muted-foreground text-[10px]">
							*Estimasi 1 blok tagihan (8x pertemuan) per siswa aktif saat ini.
						</p>
					</div>
				)}

				{/* Chart akurasi prediksi 12 bulan terakhir */}
				<div className="border-t pt-4">
					<div className="mb-2 flex items-center justify-between">
						<p className="text-sm font-medium">Akurasi Prediksi (12 Bulan)</p>
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
						<Skeleton className="h-[220px] w-full rounded-xl" />
					) : !dataAkurasi || bulanDenganData.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Belum ada tagihan bulan lalu untuk dibandingkan.
						</p>
					) : (
						<ChartContainer
							config={chartConfig}
							className="aspect-auto h-[220px] w-full"
						>
							<ComposedChart data={chartData}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="bulanSingkat"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
								/>
								<YAxis
									yAxisId="rupiah"
									hide
									domain={[0, (max: number) => max * 1.1]}
								/>
								<YAxis
									yAxisId="persen"
									orientation="right"
									hide
									domain={[0, 100]}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											formatter={(value, name) => {
												if (name === "akurasiPersen") {
													return [`${Number(value)}%`, "Akurasi"];
												}
												return [
													toRupiah(Number(value)),
													name === "totalTagihan"
														? "Tagihan Terjadwal"
														: "Sudah Lunas",
												];
											}}
											labelFormatter={(_, payload) => {
												const item = payload?.[0]?.payload as
													| {
															bulan?: string;
															isBulanBerjalanAtauDepan?: boolean;
													  }
													| undefined;
												if (!item) return "";
												return item.isBulanBerjalanAtauDepan
													? `${item.bulan} (belum final)`
													: item.bulan;
											}}
										/>
									}
								/>
								<Bar
									yAxisId="rupiah"
									dataKey="totalTagihan"
									fill="var(--color-totalTagihan)"
									radius={[4, 4, 0, 0]}
									barSize={18}
								/>
								<Bar
									yAxisId="rupiah"
									dataKey="totalTerbayar"
									fill="var(--color-totalTerbayar)"
									radius={[4, 4, 0, 0]}
									barSize={18}
								/>
								<Line
									yAxisId="persen"
									type="monotone"
									dataKey="akurasiPersen"
									stroke="var(--color-akurasiPersen)"
									strokeWidth={2}
									dot={{ r: 3 }}
									connectNulls
								/>
							</ComposedChart>
						</ChartContainer>
					)}
					<p className="text-muted-foreground mt-2 text-[10px]">
						Batang = tagihan terjadwal vs yang sudah lunas per bulan. Garis = %
						akurasi (lunas ÷ tagihan). Bulan berjalan & bulan depan masih
						berjalan periodenya, jadi akurasinya belum final.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
