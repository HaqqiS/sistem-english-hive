import HistoryPembayaranMuridClient from "@/app/_components/views/admin/pembayaran/historyPembayaranMurid/history-pembayaran-murid-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function DetailPembayaranMuridPage({
  params,
}: {
  params: Promise<{ muridId: string }>;
}) {
  const { muridId } = await params;

  await Promise.all([
    api.pembayaran.getAll.prefetch({
      muridId: muridId,
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
