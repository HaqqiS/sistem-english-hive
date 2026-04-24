"use client";

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
import { formatStatus, statusKelasColorMap } from "@/utils/statusUtils";

// Removed local getBadgeKelasStatusTheme as it is now in @/utils/statusUtils

export default function ScheduleList() {
	const { todaySchedule } = useDashboard();
	const { data, isLoading } = todaySchedule;

	const hasSchedule = data && data.length > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Jadwal Hari Ini</CardTitle>
				<CardDescription>{dayjs().format("dddd, D MMMM YYYY")}</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<ScrollArea className="h-[300px]">
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
										jadwal.kelas.historyGuruKelases.length > 0
											? jadwal.kelas.historyGuruKelases
													.map((h) => h.guru.name)
													.join(" & ")
											: "-";

									const isAttended = jadwal.sesiPertemuanKelases.some(
										(sesi) => sesi.isSelesaiAbsen,
									);

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
													variant="outline"
													className={cn(
														"h-5 border-0 px-1.5 text-[10px] font-normal",
														jadwal.kelas.statusKelas &&
															statusKelasColorMap[jadwal.kelas.statusKelas],
													)}
												>
													{jadwal.kelas.statusKelas &&
														formatStatus(jadwal.kelas.statusKelas)}
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
