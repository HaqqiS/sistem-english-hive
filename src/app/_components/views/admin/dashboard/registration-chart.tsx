"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
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
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import { api } from "@/trpc/react";
import { RentangBulanToggle, useRentangBulan } from "./rentang-bulan";

const chartConfig = {
	// Pendaftar memakai warna utama tema. Aktif & Lulus memakai warna yang jelas
	// berbeda (palet chart tema ini gradasi satu warna sehingga sulit dibedakan).
	pendaftar: {
		label: "Pendaftar",
		color: "var(--chart-1)",
	},
	aktif: {
		label: "Aktif",
		color: "#3b82f6",
	},
	lulus: {
		label: "Lulus",
		color: "#f59e0b",
	},
} satisfies ChartConfig;

function Ringkasan({
	label,
	nilai,
	warna,
}: {
	label: string;
	nilai: string;
	warna?: string;
}) {
	return (
		<div className="min-w-24 rounded-lg border px-3 py-2">
			<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
				{warna && (
					<span
						className="inline-block h-2 w-2 rounded-full"
						style={{ backgroundColor: warna }}
					/>
				)}
				{label}
			</div>
			<div className="text-xl font-bold">{nilai}</div>
		</div>
	);
}

/**
 * Tren pendaftaran lebar penuh, membandingkan jumlah pendaftar baru dengan yang
 * saat ini berstatus Aktif dan Lulus per bulan. Rentang otomatis 6 bulan di HP dan
 * 12 bulan di layar lebar, dan bisa diganti manual lewat tombol 6 / 12 Bln.
 */
export default function RegistrationChart() {
	const { activeCabangId } = useGlobalCabangStore();
	const { jumlahBulan, setPilihan } = useRentangBulan();

	const { data, isLoading } = api.dashboard.getRegistrationTrend.useQuery({
		cabangId:
			activeCabangId === "ALL" || !activeCabangId ? undefined : activeCabangId,
		jumlahBulan,
	});

	const chartData = data ?? [];
	const totalPendaftar = chartData.reduce((a, b) => a + b.pendaftar, 0);
	const totalAktif = chartData.reduce((a, b) => a + b.aktif, 0);
	const totalLulus = chartData.reduce((a, b) => a + b.lulus, 0);
	// Konversi: pendaftar yang berhasil menjadi siswa (aktif + lulus)
	const konversi =
		totalPendaftar > 0
			? Math.round(((totalAktif + totalLulus) / totalPendaftar) * 100)
			: 0;
	const barMaks = jumlahBulan > 6 ? 22 : 34;

	return (
		<Card className="md:col-span-2">
			<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1">
					<CardTitle>Tren Pendaftaran Murid</CardTitle>
					<CardDescription>
						{jumlahBulan} bulan terakhir: jumlah pendaftar dibandingkan dengan
						yang saat ini berstatus aktif dan lulus
					</CardDescription>
				</div>
				<div className="flex flex-col gap-3 lg:items-end">
					<RentangBulanToggle jumlahBulan={jumlahBulan} onChange={setPilihan} />
					{!isLoading && (
						<div className="flex flex-wrap gap-2">
							<Ringkasan
								label="Total Pendaftar"
								nilai={String(totalPendaftar)}
								warna="var(--chart-1)"
							/>
							<Ringkasan
								label="Aktif"
								nilai={String(totalAktif)}
								warna="#3b82f6"
							/>
							<Ringkasan
								label="Lulus"
								nilai={String(totalLulus)}
								warna="#f59e0b"
							/>
							<Ringkasan
								label="Konversi (Aktif + Lulus)"
								nilai={`${konversi}%`}
							/>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="px-2 sm:p-6">
				{isLoading ? (
					<Skeleton className="h-[300px] w-full rounded-xl" />
				) : (
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[300px] w-full"
					>
						<BarChart
							accessibilityLayer
							data={chartData}
							margin={{ top: 24, left: 12, right: 12 }}
							barGap={4}
						>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="name"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								// 12 bulan: tampilkan nama bulan saja agar label tidak berdesakan
								tickFormatter={(v: string) =>
									jumlahBulan > 6 ? v.replace(/ \d{4}$/, "") : v
								}
							/>
							<ChartTooltip
								cursor={{ fill: "var(--muted)", opacity: 0.2 }}
								content={
									<ChartTooltipContent
										className="w-[170px]"
										labelFormatter={(value) => value}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent />} />
							<Bar
								dataKey="pendaftar"
								fill="var(--color-pendaftar)"
								radius={[6, 6, 0, 0]}
								maxBarSize={barMaks}
							>
								<LabelList
									dataKey="pendaftar"
									position="top"
									offset={6}
									className="fill-foreground"
									fontSize={12}
								/>
							</Bar>
							<Bar
								dataKey="aktif"
								fill="var(--color-aktif)"
								radius={[6, 6, 0, 0]}
								maxBarSize={barMaks}
							>
								<LabelList
									dataKey="aktif"
									position="top"
									offset={6}
									className="fill-foreground"
									fontSize={12}
								/>
							</Bar>
							<Bar
								dataKey="lulus"
								fill="var(--color-lulus)"
								radius={[6, 6, 0, 0]}
								maxBarSize={barMaks}
							>
								<LabelList
									dataKey="lulus"
									position="top"
									offset={6}
									className="fill-foreground"
									fontSize={12}
								/>
							</Bar>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}