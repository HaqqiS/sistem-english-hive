"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { columns as columnsAbsen } from "./columns/columns-absen-guru";
import { columns as columnsGuru } from "./columns/columns-guru";
import type { TypeAbsensiGuru } from "@/types/absenGuru.type";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";

interface GuruClientProps {
  initialData: TypeAbsensiGuru[];
}

export default function GuruClient({ initialData }: GuruClientProps) {
  const { mutations } = useAbsenGuru({
    // onSuccessUpdate: () => {},
  });

  const { data: dataAbsensiGuru } = useAbsenGuru({
    initialDataAbsensi: initialData,
  });

  const { data: dataGuru } = useUser();

  const columnsAbsensiGuru = columnsAbsen({
    onEditClick: (item) => {
      console.log(item);
    },
    onDeleteClick: (id) => {
      console.log(id);
    },
    onStatusChange: (item, status) => {
      console.log(item, status);
      mutations.updateStatus.mutate({
        absensiId: item.id,
        isVerified: status,
      });
    },
    isPendingStatusChange: mutations.updateStatus.isPending,
  });
  const columnsListGuru = columnsGuru({
    onEditClick: (item) => {
      console.log(item);
    },
    onDeleteClick: (id) => {
      console.log(id);
    },
  });

  return (
    <Tabs defaultValue="absen">
      <TabsList>
        <TabsTrigger value="absen">Verifikasi Absen</TabsTrigger>
        <TabsTrigger value="guru">List Guru</TabsTrigger>
      </TabsList>
      <TabsContent value="absen">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">List Absen Guru</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini mengatur verifikasi absen guru.
                </p>
              </div>
            </header>
          </div>
        </div>

        <DataTable columns={columnsAbsensiGuru} data={dataAbsensiGuru ?? []} />
      </TabsContent>

      <TabsContent value="guru">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">List Guru</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini menampilkan daftar guru.
                </p>
              </div>
            </header>
          </div>
        </div>

        <DataTable columns={columnsListGuru} data={dataGuru ?? []} />
      </TabsContent>
    </Tabs>
  );
}
