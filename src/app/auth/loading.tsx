import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AuthLoading() {
	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader className="space-y-2">
							<Skeleton className="h-6 w-1/3" /> {/* Title */}
							<Skeleton className="h-4 w-3/4" /> {/* Description */}
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-16" /> {/* Label */}
								<Skeleton className="h-9 w-full" /> {/* Input */}
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Skeleton className="h-4 w-20" /> {/* Label */}
									<Skeleton className="h-3 w-24" /> {/* Forgot Password */}
								</div>
								<Skeleton className="h-9 w-full" /> {/* Input */}
							</div>
							<Skeleton className="mt-4 h-9 w-full" /> {/* Button */}
							<div className="mt-4 text-center">
								<Skeleton className="mx-auto h-4 w-48" />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
