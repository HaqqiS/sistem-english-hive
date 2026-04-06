import type { Metadata } from "next";
import BookOrderClient from "@/app/_components/views/admin/buku/book-order-client";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Order Buku Kelas",
};

export default async function BookOrderPage() {
	await Promise.all([api.kelas.getKelasSiapOrderBuku.prefetch({})]);

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<main className="flex flex-1 flex-col gap-4 pt-0">
				<HydrateClient>
					<BookOrderClient />
				</HydrateClient>
			</main>
		</div>
	);
}
