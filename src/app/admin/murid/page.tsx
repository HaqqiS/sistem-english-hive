import MuridClient from "@/app/_components/views/admin/murid/murid-client";
import { api, HydrateClient } from "@/trpc/server";

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function MuridPage() {
  // await delay(600000);

  const dataMuridNotRegistered = await api.murid.getMuridWhereNotRegistered();
  const dataAllMurid = await api.murid.getAllMurid();
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <MuridClient
            initialDataMuridNotRegistered={dataMuridNotRegistered}
            initialDataAllMurid={dataAllMurid}
          />
        </HydrateClient>
      </main>
    </div>
  );
}
