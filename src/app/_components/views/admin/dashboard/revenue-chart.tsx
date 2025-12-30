"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import { toRupiah } from "@/utils/toRupiah";

const chartConfig = {
	total: {
		label: "Total",
		color: "hsl(var(--primary))",
	},
	spp: {
		label: "SPP",
		color: "#3b82f6", // Blue
	},
	buku: {
		label: "Buku",
		color: "#f59e0b", // Amber
	},
	registration: {
		label: "Registrasi",
		color: "#10b981", // Green
	},
} satisfies ChartConfig;

export default function RevenueChart() {
	const { revenueTrend } = useDashboard();
	const { data, isLoading } = revenueTrend;

	const chartData = data ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tren Pendapatan Breakdown</CardTitle>
				<CardDescription>
					6 Bulan Terakhir (SPP, Buku, Registrasi)
				</CardDescription>
			</CardHeader>
			<CardContent className="px-2 sm:p-6">
				{isLoading ? (
					<Skeleton className="h-[250px] w-full rounded-xl" />
				) : (
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[250px] w-full"
					>
						<AreaChart
							accessibilityLayer
							data={chartData}
							margin={{
								left: 12,
								right: 12,
							}}
						>
							<defs>
								{/* Gradients for each category */}
								<linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-total)"
										stopOpacity={0.1}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-total)"
										stopOpacity={0.01}
									/>
								</linearGradient>
								<linearGradient id="fillSpp" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-spp)"
										stopOpacity={0.4}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-spp)"
										stopOpacity={0.05}
									/>
								</linearGradient>
								<linearGradient id="fillBuku" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-buku)"
										stopOpacity={0.4}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-buku)"
										stopOpacity={0.05}
									/>
								</linearGradient>
								<linearGradient id="fillReg" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-registration)"
										stopOpacity={0.4}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-registration)"
										stopOpacity={0.05}
									/>
								</linearGradient>
							</defs>

							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="name"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(value) => value.slice(0, 3)}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										labelFormatter={(value) => value}
										formatter={(value, name) => (
											<div className="flex min-w-[120px] items-center justify-between text-xs">
												<span className="text-muted-foreground mr-2 capitalize">
													{chartConfig[name as keyof typeof chartConfig]
														?.label ?? name}
												</span>
												<span className="font-bold font-mono">
													{toRupiah(Number(value))}
												</span>
											</div>
										)}
									/>
								}
							/>

							{/* Total Line (Background reference) */}
							<Area
								dataKey="total"
								type="monotone"
								fill="url(#fillTotal)"
								fillOpacity={0.4}
								stroke="var(--color-total)"
								strokeWidth={1}
								strokeDasharray="4 4"
							/>

							{/* Breakdown Lines (Unstacked) */}
							<Area
								dataKey="spp"
								type="monotone"
								fill="url(#fillSpp)"
								fillOpacity={0.4}
								stroke="var(--color-spp)"
								strokeWidth={2}
							/>
							<Area
								dataKey="buku"
								type="monotone"
								fill="url(#fillBuku)"
								fillOpacity={0.4}
								stroke="var(--color-buku)"
								strokeWidth={2}
							/>
							<Area
								dataKey="registration"
								type="monotone"
								fill="url(#fillReg)"
								fillOpacity={0.4}
								stroke="var(--color-registration)"
								strokeWidth={2}
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
