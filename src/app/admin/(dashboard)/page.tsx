import { api, HydrateClient } from "@/trpc/server";
import DashboardClientPage from "./dashboard-client";

export default async function AdminDashboardPage() {
  await api.pembayaran.getTagihanJatuhTempo.prefetch();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <DashboardClientPage />
        </HydrateClient>
      </main>
    </div>
  );
}
