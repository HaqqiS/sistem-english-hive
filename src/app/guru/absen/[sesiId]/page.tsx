import type { Metadata } from "next";
import DetailAbsenMuridClient from "@/app/_components/views/guru/absenMurid/detailAbsenMurid/detail-absen-murid-client";
import { api, HydrateClient } from "@/trpc/server";

interface PageProps {
	params: Promise<{ sesiId: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { sesiId } = await params;

	// Fetch data ringkas untuk judul (pastikan ini cepat/cached)
	const sesi = await api.sesiPertemuan.getById({ id: sesiId });

	return {
		title: sesi ? `Absensi Murid | ${sesi.kelas.kodeKelas}` : "Absensi Murid",
	};
}

export default async function DetailAbsenMuridPage({
	params,
}: {
	params: Promise<{ sesiId: string }>;
}) {
	const { sesiId } = await params;

	await api.absenMurid.getMuridForAbsensi.prefetch({ sesiId });

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<DetailAbsenMuridClient />
				</HydrateClient>
			</main>
		</div>
	);
}
