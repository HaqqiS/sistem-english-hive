import SiswaClient from "@/app/_components/views/admin/siswa/siswa-client";
import { api, HydrateClient } from "@/trpc/server";

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function SiswaPage() {
  // await delay(600000);

  const dataSiswaNotRegistered = await api.murid.getMuridWhereNotRegistered();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <SiswaClient initialDataMuridNotRegistered={dataSiswaNotRegistered} />
        </HydrateClient>
      </main>
    </div>
  );
}
