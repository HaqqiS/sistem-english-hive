import GuruClient from "@/app/_components/views/admin/guru/guru-client";
import { api, HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Guru",
};

export default async function VerifikasiAbsenPage() {
  await Promise.all([
    api.absenGuru.getAllAbsensi.prefetch({
      pageIndex: 0,
      pageSize: 10,
    }),
    api.user.getAllGuruComplete.prefetch(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <GuruClient />
        </HydrateClient>
      </main>
    </div>
  );
}
