import GuruClient from "@/app/_components/views/admin/guru/guru-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function VerifikasiAbsenPage() {
  const dataAbsensiGuru = await api.absenGuru.getAllAbsensi();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <GuruClient initialData={dataAbsensiGuru} />
        </HydrateClient>
      </main>
    </div>
  );
}
