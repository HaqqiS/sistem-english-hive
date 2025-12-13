import JamClient from "@/app/_components/views/admin/jam/jam-client";
import { api, HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Ruang",
};

export default async function JamPage() {
  await Promise.all([
    api.jam.getAllJamTetap.prefetch(),
    api.jam.getAllJamCustom.prefetch(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <JamClient />
        </HydrateClient>
      </main>
    </div>
  );
}
