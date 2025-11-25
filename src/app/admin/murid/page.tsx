import MuridClient from "@/app/_components/views/admin/murid/murid-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function MuridPage() {
  const dataMuridNotRegistered = await api.murid.getMuridNotRegisteredPaginated(
    {
      pageIndex: 0,
      pageSize: 10,
    },
  );
  const dataAllMurid = await api.murid.getAllPaginated({
    pageIndex: 0,
    pageSize: 10,
  });
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
