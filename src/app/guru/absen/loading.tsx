import { Card, CardContent } from "@/components/ui/card";
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

			{/* Card List Skeleton (Matching Accordion Layout) */}
			<div className="space-y-4">
				{Array.from({ length: 3 }, (_, k) => k).map((k) => (
					<Card key={k} className="overflow-hidden">
						<CardContent className="p-0">
							{/* Mimic Accordion Trigger */}
							<div className="flex items-center justify-between px-6 py-4">
								<div className="flex flex-1 items-center justify-between pr-4">
									<div className="flex items-center gap-3">
										{/* Icon */}
										<Skeleton className="h-10 w-10 rounded-lg" />
										<div className="flex flex-col gap-2">
											<Skeleton className="h-5 w-32" /> {/* Kode Kelas */}
										</div>
									</div>
									<Skeleton className="h-6 w-16 rounded-full" /> {/* Badge */}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
