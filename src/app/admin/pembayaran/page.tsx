import PembayaranClient from "@/app/_components/views/admin/pembayaran/pembayaran-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function KelasPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <PembayaranClient />
        </HydrateClient>
      </main>
    </div>
  );
}
