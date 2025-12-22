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
	revenue: {
		label: "Pendapatan",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export default function RevenueChart() {
	const { revenueTrend } = useDashboard();
	const { data, isLoading } = revenueTrend;

	const chartData = data ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tren Pendapatan (Lunas)</CardTitle>
				<CardDescription>6 Bulan Terakhir</CardDescription>
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
								<linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-revenue)"
										stopOpacity={0.8}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-revenue)"
										stopOpacity={0.1}
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
										indicator="dot" // Use dot indicator
										labelFormatter={(value) => value}
										formatter={(value) => toRupiah(Number(value))}
									/>
								}
							/>
							<Area
								dataKey="value"
								// type="natural"
								type="monotone"
								fill="url(#fillRevenue)" // Use the gradient
								fillOpacity={0.4}
								stroke="var(--color-revenue)"
								strokeWidth={2} // Thicker stroke
								stackId="a"
							/>
						</AreaChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
