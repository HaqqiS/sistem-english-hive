import AbsenClient from "@/app/_components/views/admin/guru/absenGuru/absen-guru-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function VerifikasiAbsenPage() {
  const dataAbsensiGuru = await api.absenGuru.getAllAbsensi();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <header className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-xl">Kelola Guru</h1>
          <p className="text-muted-foreground text-sm">
            This is the guru management page.
          </p>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <AbsenClient initialData={dataAbsensiGuru} />
        </HydrateClient>
      </main>
    </div>
  );
}
