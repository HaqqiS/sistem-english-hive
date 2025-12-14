import AbsenMuridClient from "@/app/_components/views/guru/absenMurid/absen-murid-client";
import { api, HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Absensi Murid",
};

export default async function AbsensiMuridPage() {
	await api.kelas.getKelasWithSesiForGuru.prefetch();
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<header className="flex items-center justify-between pt-6">
				<div>
					<h1 className="text-xl">Daftar Kelas Aktif</h1>
					<p className="text-muted-foreground text-sm">
						Pilih kelas untuk melakukan absensi
					</p>
				</div>
			</header>
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<AbsenMuridClient />
				</HydrateClient>
			</main>
		</div>
	);
}
