import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRuangLoading() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			{/* Tabs List Skeleton */}
			<div className="flex gap-2 border-b pt-4 pb-2">
				<Skeleton className="h-9 w-28 rounded-md" />
				<Skeleton className="h-9 w-28 rounded-md" />
				<Skeleton className="h-9 w-32 rounded-md" />
				<Skeleton className="h-9 w-32 rounded-md" />
			</div>

			{/* Header Section */}
			<div className="mt-4 flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-32" />
					<Skeleton className="h-9 w-32" />
				</div>
			</div>

			{/* Table Content Skeleton */}
			<div className="mt-4 space-y-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between border-b pb-4 last:border-0"
					>
						<div className="space-y-2">
							<Skeleton className="h-5 w-48" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-8 w-8" />
					</div>
				))}
			</div>
		</div>
	);
}
