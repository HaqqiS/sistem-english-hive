import MuridClient from "@/app/_components/views/admin/murid/murid-client";
import { api, HydrateClient } from "@/trpc/server";

export default async function MuridPage() {
  await Promise.all([
    api.murid.getMuridNotRegisteredPaginated.prefetch({
      pageIndex: 0,
      pageSize: 10,
    }),
    api.murid.getAllPaginated.prefetch({
      pageIndex: 0,
      pageSize: 10,
    }),
  ]);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          <MuridClient />
        </HydrateClient>
      </main>
    </div>
  );
}
