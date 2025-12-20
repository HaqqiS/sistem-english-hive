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
import { api } from "@/trpc/react";
import dayjs from "@/utils/dateUtils";

export default function ScheduleList() {
	const { data, isLoading } = api.dashboard.getTodaySchedule.useQuery();

	const hasSchedule = data && data.length > 0;

	return (
		<Card className="col-span-1 md:col-span-2 lg:col-span-1">
			<CardHeader>
				<CardTitle>Jadwal Hari Ini</CardTitle>
				<CardDescription>{dayjs().format("dddd, D MMMM YYYY")}</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<ScrollArea className="h-[300px]">
					<div className="flex flex-col gap-0">
						{isLoading ? (
							<div className="p-4 text-center text-sm text-muted-foreground">
								Loading jadwal...
							</div>
						) : !hasSchedule ? (
							<div className="p-4 text-center text-sm text-muted-foreground">
								Tidak ada jadwal kelas hari ini.
							</div>
						) : (
							data?.map((sesi) => (
								<div
									key={sesi.id}
									className="flex flex-col gap-1 border-b p-4 last:border-0 hover:bg-muted/50"
								>
									<div className="flex items-center justify-between">
										<span className="font-semibold">
											{dayjs(sesi.tanggalWaktu).format("HH:mm")}
										</span>
										<Badge variant="outline">{sesi.ruang.namaRuang}</Badge>
									</div>
									<div className="text-sm font-medium">
										{sesi.kelas.kodeKelas}
									</div>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>{sesi.kelas.jenisKelas}</span>
										<span>
											{sesi.absensiGurus?.length > 0
												? `Guru: ${sesi.absensiGurus[0]?.guru.name ?? "-"}`
												: "Guru: -"}
										</span>
									</div>
								</div>
							))
						)}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
