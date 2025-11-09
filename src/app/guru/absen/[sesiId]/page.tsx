import DetailAbsenMuridClient from "@/app/_components/views/guru/absenMurid/detailAbsenMurid/detail-absen-murid-client";
import { HydrateClient } from "@/trpc/server";

export default function DetailAbsenMuridPage() {
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
