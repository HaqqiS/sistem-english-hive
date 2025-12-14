import { Skeleton } from "@/components/ui/skeleton";

export default function AdminGuruLoading() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			{/* Tabs Skeleton */}
			<div className="flex gap-2 border-b pt-4 pb-2">
				<Skeleton className="h-9 w-32" />
				<Skeleton className="h-9 w-24" />
			</div>

			{/* Toolbar */}
			<div className="mt-2 flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-60" />
				</div>
				<Skeleton className="h-9 w-32" /> {/* Button */}
			</div>

			{/* Table Skeleton */}
			<div className="mt-4 space-y-4 rounded-md border p-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-5 w-48" />
						</div>
						<Skeleton className="h-6 w-24 rounded-full" />
						<Skeleton className="h-8 w-8" />
					</div>
				))}
			</div>
		</div>
	);
}
