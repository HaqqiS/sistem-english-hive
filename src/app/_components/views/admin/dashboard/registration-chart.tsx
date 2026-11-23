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
import { useDashboard } from "@/hooks/useDashboard";

const chartConfig = {
	pendaftar: {
		label: "Pendaftar",
		color: "var(--chart-1)",
	},
	aktif: {
		label: "Menjadi Aktif",
		color: "var(--chart-2)",
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
 * Tren pendaftaran 6 bulan terakhir, lebar penuh, membandingkan jumlah
 * pendaftar baru dengan yang saat ini berstatus Aktif per bulan.
 */
export default function RegistrationChart() {
	const { registrationTrend } = useDashboard();
	const { data, isLoading } = registrationTrend;

	const chartData = data ?? [];
	const totalPendaftar = chartData.reduce((a, b) => a + b.pendaftar, 0);
	const totalAktif = chartData.reduce((a, b) => a + b.aktif, 0);
	const konversi =
		totalPendaftar > 0 ? Math.round((totalAktif / totalPendaftar) * 100) : 0;

	return (
		<Card className="md:col-span-2">
			<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1">
					<CardTitle>Tren Pendaftaran Murid</CardTitle>
					<CardDescription>
						6 bulan terakhir: jumlah pendaftar dibandingkan dengan yang saat ini
						berstatus aktif
					</CardDescription>
				</div>
				{!isLoading && (
					<div className="flex flex-wrap gap-2">
						<Ringkasan
							label="Total Pendaftar"
							nilai={String(totalPendaftar)}
							warna="var(--chart-1)"
						/>
						<Ringkasan
							label="Menjadi Aktif"
							nilai={String(totalAktif)}
							warna="var(--chart-2)"
						/>
						<Ringkasan label="Konversi Aktif" nilai={`${konversi}%`} />
					</div>
				)}
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
							barGap={6}
						>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="name"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
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
								maxBarSize={56}
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
								maxBarSize={56}
							>
								<LabelList
									dataKey="aktif"
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