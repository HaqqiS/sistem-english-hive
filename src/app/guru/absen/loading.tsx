import { Skeleton } from "@/components/ui/skeleton";

export default function GuruAbsenLoading() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			{/* Header */}
			<header className="flex items-center justify-between pt-6">
				<div className="space-y-2">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</header>

			{/* Accordion List Skeleton */}
			<div className="mt-6 space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-4">
						<div className="mb-4 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-lg" />
								<div className="space-y-1">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-3 w-20" />
								</div>
							</div>
							<Skeleton className="h-6 w-16 rounded-full" />
						</div>
						<Skeleton className="h-12 w-full rounded-md opacity-50" />
					</div>
				))}
			</div>
		</div>
	);
}
