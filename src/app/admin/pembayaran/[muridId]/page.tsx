import HistoryPembayaranMuridClient from "@/app/_components/views/admin/pembayaran/historyPembayaranMurid/history-pembayaran-murid-client";
import { api, HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

interface PageProps {
	params: Promise<{ muridId: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { muridId } = await params;

	// Fetch data ringkas untuk judul (pastikan ini cepat/cached)
	const murid = await api.murid.getMuridById({ id: muridId });

	return {
		title: murid ? `Detail Pembayaran | ${murid.namaLengkap}` : "Detail Murid",
	};
}

export default async function DetailPembayaranMuridPage({
	params,
}: {
	params: Promise<{ muridId: string }>;
}) {
	const { muridId } = await params;

	await Promise.all([
		api.pembayaran.getAllPaginated.prefetch({
			muridId: muridId,
			pageIndex: 0,
			pageSize: 30,
		}),
		api.pembayaran.getSaldoByMuridId.prefetch({
			muridId: muridId,
		}),
	]);

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<main className="flex flex-1 flex-col gap-4 pt-6">
				<HydrateClient>
					<HistoryPembayaranMuridClient />
				</HydrateClient>
			</main>
		</div>
	);
}
