import AbsenMuridClient from "@/app/_components/views/guru/absenMurid/absen-murid-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function AbsensiMuridPage() {
  const dataKelasWithSesi = await api.kelas.getKelasWithSesiForGuru();
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <header className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-xl">Kelola Absensi Murid</h1>
          <p className="text-muted-foreground text-sm">
            This is the absensi murid management page.
          </p>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <AbsenMuridClient initialData={dataKelasWithSesi} />
        </HydrateClient>
      </main>
    </div>
  );
}
