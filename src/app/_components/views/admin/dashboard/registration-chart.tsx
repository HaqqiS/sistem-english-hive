"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
import { api } from "@/trpc/react";

const chartConfig = {
	views: {
		label: "Pendaftar",
	},
	value: {
		label: "Murid",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export default function RegistrationChart() {
	const { data, isLoading } = api.dashboard.getRegistrationTrend.useQuery();

	// Format data for Recharts (handling empty states handled by query result structure)
	const chartData = data ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tren Pendaftaran Murid</CardTitle>
				<CardDescription>6 Bulan Terakhir</CardDescription>
			</CardHeader>
			<CardContent className="px-2 sm:p-6">
				{isLoading ? (
					<div className="flex aspect-auto h-[250px] w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
						Loading...
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[250px] w-full"
					>
						<BarChart
							accessibilityLayer
							data={chartData}
							margin={{
								left: 12,
								right: 12,
							}}
						>
							<defs>
								<linearGradient
									id="fillRegistration"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="0%"
										stopColor="var(--color-value)"
										stopOpacity={1}
									/>
									<stop
										offset="100%"
										stopColor="var(--color-value)"
										stopOpacity={0.6}
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
								cursor={{ fill: "var(--muted)", opacity: 0.2 }} // Add subtle cursor background
								content={
									<ChartTooltipContent
										className="w-[150px]"
										nameKey="views"
										labelFormatter={(value) => value}
									/>
								}
							/>
							<Bar
								dataKey="value"
								fill="url(#fillRegistration)" // Use gradient
								radius={[8, 8, 0, 0]} // More rounded corners
								maxBarSize={50} // Prevent overly wide bars
							/>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
