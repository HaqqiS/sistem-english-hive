import type { Metadata } from "next";
import { Suspense } from "react";
import PembayaranClient from "@/app/_components/views/admin/pembayaran/pembayaran-client";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Kelola Pembayaran",
};

export default async function PembayaranPage() {
	// const dataPembayaran = await api.pembayaran.getAllPaginated({
	//   pageIndex: 0,
	//   pageSize: 10,
	// });

	await Promise.all([
		api.pembayaran.getAllPaginated.prefetch({
			pageIndex: 0,
			pageSize: 50,
		}),
		api.pembayaran.getTagihanJatuhTempo.prefetch({}),
	]);

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<Suspense fallback={null}>
						<PembayaranClient />
					</Suspense>
				</HydrateClient>
			</main>
		</div>
	);
}
