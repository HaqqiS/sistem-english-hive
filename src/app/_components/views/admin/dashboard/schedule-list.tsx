"use client";

import { StatusKelas } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import dayjs from "@/utils/dateUtils";

export default function ScheduleList() {
	const { todaySchedule } = useDashboard();
	const { data, isLoading } = todaySchedule;

	const hasSchedule = data && data.length > 0;

	return (
		<Card className="col-span-1 md:col-span-2 lg:col-span-1">
			<CardHeader>
				<CardTitle>Jadwal Hari Ini</CardTitle>
				<CardDescription>{dayjs().format("dddd, D MMMM YYYY")}</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<ScrollArea className="h-[calc(100vh-200px)]">
					<div className="flex flex-col gap-0">
						{isLoading ? (
							[1, 2, 3].map((id) => (
								<div
									key={id}
									className="flex flex-col gap-2 border-b p-4 last:border-0"
								>
									<div className="flex items-center justify-between">
										<Skeleton className="h-5 w-16" />
										<Skeleton className="h-5 w-20" />
									</div>
									<Skeleton className="h-5 w-32" />
									<div className="flex items-center justify-between pt-1">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
									</div>
								</div>
							))
						) : !hasSchedule ? (
							<div className="p-4 text-center text-sm text-muted-foreground">
								Tidak ada jadwal kelas hari ini.
							</div>
						) : (
							data
								?.sort((a, b) => {
									const timeA =
										a.jamSlotTetap?.jamMulai ?? a.jamSlotCustom?.jamMulai ?? "";
									const timeB =
										b.jamSlotTetap?.jamMulai ?? b.jamSlotCustom?.jamMulai ?? "";
									return timeA.localeCompare(timeB);
								})
								.map((jadwal) => {
									const jamMulai =
										jadwal.jamSlotTetap?.jamMulai ??
										jadwal.jamSlotCustom?.jamMulai ??
										"-";
									const guruName =
										jadwal.kelas.historyGuruKelases[0]?.guru?.name ?? "-";

									const isAttended = jadwal.sesiPertemuanKelases.length > 0;

									return (
										<div
											key={jadwal.id}
											className="flex flex-col gap-1 border-b p-4 last:border-0 hover:bg-muted/50"
										>
											<div className="flex items-center justify-between">
												<span className="font-semibold">{jamMulai}</span>
												<div className="flex items-center gap-2">
													{isAttended && (
														<Badge
															variant="default"
															className="bg-green-600 hover:bg-green-700 text-xs px-1.5 h-5"
														>
															Sudah Absen
														</Badge>
													)}
													<Badge variant="outline">
														{jadwal.ruang.namaRuang}
													</Badge>
												</div>
											</div>
											<div className="text-sm font-medium">
												{jadwal.kelas.kodeKelas}
											</div>
											<div className="flex items-center justify-between text-xs text-muted-foreground">
												<Badge
													className={cn(
														"h-5 border-0 px-1.5 text-[10px] font-normal",
														jadwal.kelas.statusKelas === StatusKelas.RUNNING
															? "bg-primary text-primary-foreground"
															: jadwal.kelas.statusKelas === StatusKelas.WAITING
																? "bg-yellow-500 text-yellow-50 dark:bg-yellow-500 dark:text-yellow-50"
																: "bg-blue-500 text-blue-50 dark:bg-blue-500 dark:text-blue-50",
													)}
												>
													{jadwal.kelas.statusKelas}
												</Badge>
												<span>Guru: {guruName}</span>
											</div>
										</div>
									);
								})
						)}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
