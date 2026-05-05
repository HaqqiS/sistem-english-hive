import type { Metadata } from "next";
import RekapSesiGuruClient from "@/app/_components/views/guru/absenMurid/rekap-sesi-client";
import { api, HydrateClient } from "@/trpc/server";

interface PageProps {
	params: Promise<{ kelasId: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { kelasId } = await params;
	const kelas = await api.kelas.getKelasById({ id: kelasId });

	return {
		title: kelas ? `Rekap Presensi | ${kelas.kodeKelas}` : "Rekap Presensi",
	};
}

export default async function RekapSesiGuruPage({
	params,
}: {
	params: Promise<{ kelasId: string }>;
}) {
	const { kelasId } = await params;

	// Prefetch data for hydration
	await api.sesiPertemuan.getSesiSummaryByKelasId.prefetch({ kelasId });

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<header className="flex items-center justify-between pt-6">
				<div>
					<h1 className="text-xl">Riwayat & Rekap Presensi</h1>
					<p className="text-muted-foreground text-sm">
						Melihat ringkasan seluruh sesi pertemuan dan kehadiran murid
					</p>
				</div>
			</header>
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<RekapSesiGuruClient />
				</HydrateClient>
			</main>
		</div>
	);
}
