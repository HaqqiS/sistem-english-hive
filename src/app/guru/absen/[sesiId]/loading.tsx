import { Skeleton } from "@/components/ui/skeleton";

export default function GuruDetailAbsenLoading() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			{/* Header */}
			<div className="space-y-2 pt-4">
				<Skeleton className="h-8 w-64" /> {/* Nama Kelas */}
				<Skeleton className="h-4 w-48" /> {/* Info Sesi */}
			</div>

			{/* Table List Murid */}
			<div className="mt-4 space-y-6 rounded-md border p-4">
				{/* Table Rows */}
				{Array.from({ length: 5 }, (_, i) => i).map((id) => (
					<div
						key={id}
						className="flex flex-col items-start justify-between gap-4 border-b pb-4 last:border-0 sm:flex-row sm:items-center"
					>
						<Skeleton className="h-5 w-40" /> {/* Nama Murid */}
						{/* Radio Group Skeleton */}
						<div className="flex gap-4">
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded-full" />
								<Skeleton className="h-4 w-12" />
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded-full" />
								<Skeleton className="h-4 w-12" />
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded-full" />
								<Skeleton className="h-4 w-12" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
