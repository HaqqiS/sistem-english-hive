import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<div className="space-y-6">
			{/* 1. KPI Cards Skeleton */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[0, 1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-[100px]" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-1 h-8 w-[60px]" />
							<Skeleton className="h-3 w-[120px]" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* 2. Charts Section Skeleton */}
			<div className="grid gap-4 md:grid-cols-2">
				{[0, 1].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="mb-2 h-6 w-[150px]" />
							<Skeleton className="h-4 w-[100px]" />
						</CardHeader>
						<CardContent className="px-2 sm:p-6">
							<Skeleton className="h-[250px] w-full rounded-md" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* 3. Operational Section Skeleton */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				{/* Schedule List Skeleton */}
				<Card className="col-span-1">
					<CardHeader>
						<Skeleton className="mb-2 h-6 w-[120px]" />
						<Skeleton className="h-4 w-[150px]" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[0, 1, 2].map((i) => (
								<div key={i} className="flex flex-col gap-2">
									<div className="flex justify-between">
										<Skeleton className="h-4 w-[50px]" />
										<Skeleton className="h-4 w-[80px]" />
									</div>
									<Skeleton className="h-4 w-full" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Table Skeleton */}
				<Card className="col-span-1 border-l-4 border-l-accent shadow-sm lg:col-span-2">
					<CardHeader className="flex items-center gap-4 space-y-0 pb-2">
						<div className="flex flex-1 items-center justify-between">
							<div className="space-y-2">
								<Skeleton className="h-6 w-[200px]" />
								<Skeleton className="h-4 w-[300px]" />
							</div>
							<Skeleton className="h-9 w-9 rounded-md" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Skeleton className="h-10 w-full" />
							{[0, 1, 2].map((i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
