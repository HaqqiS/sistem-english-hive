import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPembayaranLoading() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			{/* Toolbar Skeleton */}
			<div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-8 w-8 rounded-full" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-60" /> {/* Search */}
					<Skeleton className="h-9 w-32" /> {/* Filter */}
					<Skeleton className="h-9 w-40" /> {/* Add Button */}
				</div>
			</div>

			{/* Table Skeleton */}
			<div className="mt-4 rounded-md border">
				<div className="bg-muted/50 h-10 border-b" />
				<div className="space-y-6 p-4">
					{Array.from({ length: 5 }, (_, i) => i).map((id) => (
						<div key={id} className="flex items-center justify-between">
							<div className="space-y-2">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-3 w-24" />
							</div>
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-6 w-24" />
							<div className="flex gap-2">
								<Skeleton className="h-8 w-24" />
								<Skeleton className="h-8 w-8" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
