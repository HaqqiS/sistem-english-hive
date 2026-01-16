import type { Metadata } from "next";
import GuruScheduleGrid from "@/app/_components/views/guru/jadwal/guru-schedule-grid";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Jadwal Kelas",
};

export default function Page() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<header className="flex items-center justify-between pt-6">
				<div>
					<h1 className="text-xl">Jadwal</h1>
					<p className="text-muted-foreground text-sm">Jadwal kelas</p>
				</div>
			</header>
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<GuruScheduleGrid />
				</HydrateClient>
			</main>
		</div>
	);
}
