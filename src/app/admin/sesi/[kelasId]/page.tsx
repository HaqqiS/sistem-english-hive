import { HydrateClient } from "@/trpc/server";

export default function DetailSesiPertemuanKelasPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <main className="flex flex-1 flex-col gap-4 pt-0">
        <HydrateClient>
          {/* <DetailKelasClient /> */}
          test
        </HydrateClient>
      </main>
    </div>
  );
}
