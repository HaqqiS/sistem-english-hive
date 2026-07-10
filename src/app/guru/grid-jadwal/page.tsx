import type { Metadata } from "next";
import GuruGridJadwalClient from "@/app/_components/views/guru/jadwal/grid-jadwal-guru-client";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Grid Jadwal Guru",
};

export default function Page() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<header className="flex items-center justify-between pt-6">
				<div>
					<h1 className="text-xl">Grid Jadwal Guru</h1>
					<p className="text-muted-foreground text-sm">
						Jadwal semua guru, dikelompokkan per guru.
					</p>
				</div>
			</header>
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<GuruGridJadwalClient />
				</HydrateClient>
			</main>
		</div>
	);
}
