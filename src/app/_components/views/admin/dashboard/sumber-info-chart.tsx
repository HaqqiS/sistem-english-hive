"use client";

import * as React from "react";
import { Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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

// Predefined palette colors for the chart
const CATEGORY_COLORS: Record<string, string> = {
	Instagram: "#E1306C", // Iconic Pink/Purple
	WhatsApp: "#25D366", // Iconic Green
	Teman: "#3b82f6", // Blue (matches SPP in other charts)
	Other: "#64748b", // Slate 500
};

export default function SumberInfoChart() {
	const { sumberInfoDistribution } = useDashboard();

	const { data, isLoading } = sumberInfoDistribution;

	// Memoize the chart data and config to avoid re-rendering issues
	const { chartData, chartConfig } = React.useMemo(() => {
		if (!data) return { chartData: [], chartConfig: {} };

		const processedData = data.map((item) => {
			// Get color from map or fallback to muted
			const color = CATEGORY_COLORS[item.sumberInfo] || "hsl(var(--muted))";
			return {
				browser: item.sumberInfo, // Mapping sumberInfo to 'browser' key as per example or just use nameKey
				visitors: item.count,
				fill: color,
			};
		});

		const config: ChartConfig = {
			visitors: {
				label: "Pendaftar",
			},
		};

		// Dynamically add config for each source
		processedData.forEach((item) => {
			config[item.browser] = {
				label: item.browser,
				color: item.fill,
			};
		});

		return { chartData: processedData, chartConfig: config };
	}, [data]);

	const totalVisitors = React.useMemo(() => {
		return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
	}, [chartData]);

	if (isLoading) {
		return (
			<Card className="flex flex-col">
				<CardHeader className="items-center pb-0">
					<Skeleton className="h-6 w-1/2 rounded-md" />
					<Skeleton className="mt-2 h-4 w-1/3 rounded-md" />
				</CardHeader>
				<CardContent className="flex-1 pb-0 mt-4">
					<Skeleton className="mx-auto aspect-square h-[250px] rounded-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>Sumber Info Pendaftaran</CardTitle>
				<CardDescription>Distribusi Asal Informasi Pendaftar</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				{chartData.length > 0 ? (
					<ChartContainer
						config={chartConfig}
						className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
					>
						<PieChart>
							<ChartTooltip
								content={<ChartTooltipContent hideLabel nameKey="browser" />}
							/>
							<Pie
								data={chartData}
								dataKey="visitors"
								nameKey="browser"
								label
							/>
						</PieChart>
					</ChartContainer>
				) : (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						Belum ada data
					</div>
				)}
			</CardContent>
			<CardFooter className="flex-col gap-2 text-sm mt-4">
				<div className="flex items-center gap-2 leading-none font-medium">
					Total Pendaftar: {totalVisitors}
				</div>
				<div className="text-muted-foreground leading-none text-center">
					Menampilkan distribusi sumber informasi pendaftaran
				</div>
			</CardFooter>
		</Card>
	);
}
