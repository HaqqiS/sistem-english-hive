import { api } from "@/trpc/server";
import CabangClient from "@/app/_components/views/admin/cabang/cabang-client";
import type { CabangType } from "@/types/cabang.type";

async function getData(): Promise<CabangType[]> {
  return [
    {
      id: "728ed52f",
      namaCabang: "gatsu",
      alamat: "pending",
      noTelp: "1234567890",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function CabangPage() {
  // await delay(600000);

  const data = await getData();
  // const dataCabang = await api.cabang.getAll();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <header className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-xl">Ruang & Cabang</h1>
          <p className="text-muted-foreground text-sm">
            This is the cabang management page.
          </p>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <CabangClient initialData={[]} />
      </main>
    </div>
  );
}
