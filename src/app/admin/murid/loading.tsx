import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMuridLoading() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			{/* Header & Button Skeleton */}
			<div className="flex items-center justify-between space-x-2 pt-4">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" /> {/* Title */}
					<Skeleton className="h-4 w-64" /> {/* Description */}
				</div>
				<Skeleton className="h-9 w-32" /> {/* Button */}
			</div>

			{/* Table Skeleton */}
			<div className="rounded-md border">
				<div className="bg-muted/50 h-12 border-b px-4 py-3">
					{/* Table Header */}
					<div className="flex gap-4">
						<Skeleton className="h-6 w-1/4" />
						<Skeleton className="h-6 w-1/4" />
						<Skeleton className="h-6 w-1/4" />
					</div>
				</div>
				<div className="space-y-4 p-4">
					{Array.from({ length: 5 }, (_, i) => i).map((id) => (
						<div key={id} className="flex items-center justify-between gap-4">
							<div className="flex flex-1 items-center gap-3">
								<Skeleton className="h-4 w-4" /> {/* Checkbox */}
								<div className="space-y-1">
									<Skeleton className="h-5 w-40" /> {/* Nama */}
									<Skeleton className="h-3 w-24" /> {/* Subtext */}
								</div>
							</div>
							<Skeleton className="h-6 w-20 rounded-full" /> {/* Badge */}
							<Skeleton className="h-8 w-8" /> {/* Action */}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
