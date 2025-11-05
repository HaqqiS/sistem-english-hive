"use client";

// import { DataTable } from "@/app/_components/shared/data-table";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { columns as kelas } from "./columns/columns-kelas";
import { columns as columnsPendaftaranKelas } from "./columns/columns-pendaftaran-kelas";
import type { KelasType } from "@/types/kelas.type";
import TambahProgramKelas from "./drawers/tambah-kelas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PendaftaranKelasType } from "@/types/pendaftaranKelas.type";
import TambahPendaftaranKelas from "./drawers/tambah-pendaftaran-kelas";
import { useKelas } from "@/hooks/useKelas";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";

interface ProgramKelasClientProps {
  initialDataProgram: KelasType[];
  initialDataPendaftaran: PendaftaranKelasType[];
}

export default function ProgramKelasClient({
  initialDataProgram,
  initialDataPendaftaran,
}: ProgramKelasClientProps) {
  const { data: dataKelas } = useKelas({
    initialData: initialDataProgram,
  });
  const { data: dataPendaftaranKelas } = usePendaftaranKelas({
    initialData: initialDataPendaftaran,
  });

  const columnsKelas = kelas({
    onEditClick: (item) => {
      console.log("clicked");
    },
    onDeleteClick: (cabangId, cabangName) => {
      console.log("deleted");
    },
  });

  const columnsPendaftaran = columnsPendaftaranKelas({
    onEditClick: (item) => {
      console.log("clicked");
    },
    onDeleteClick: (pendaftaranId) => {
      console.log("deleted");
    },
  });

  return (
    <Tabs defaultValue="programKelas">
      <TabsList>
        <TabsTrigger value="programKelas">Program Kelas</TabsTrigger>
        <TabsTrigger value="pendaftaranKelas">
          Pendaftaran Program Kelas
        </TabsTrigger>
      </TabsList>
      <TabsContent value="programKelas">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">Kelola Program Kelas</h1>
                <p className="text-muted-foreground text-sm">
                  This is the kelas management page.
                </p>
              </div>
            </header>
            <TambahProgramKelas />
          </div>

          {/* <DataTable
            filterColumnId="kodeKelas"
            filterColumnPlaceholder="Filter Kode Kelas..."
            columns={columnsKelas}
            data={dataKelas ?? []}
            toolbar={(table) => (
              <div className="flex items-center gap-2">
                <Input
                    placeholder="Cari nama cabang..."
                    value={
                      (table.getColumn("namaCabang")?.getFilterValue() as string) ??
                      ""
                    }
                    onChange={(event) =>
                      table
                        .getColumn("namaCabang")
                        ?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                  />
              </div>
            )}
          /> */}
          <DataTable columns={columnsKelas} data={dataKelas ?? []} />
        </div>
      </TabsContent>
      <TabsContent value="pendaftaranKelas">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">Kelola Pendaftaran Kelas</h1>
                <p className="text-muted-foreground text-sm">
                  This is the kelas management page.
                </p>
              </div>
            </header>
            <TambahPendaftaranKelas />
          </div>

          <DataTable
            columns={columnsPendaftaran}
            data={dataPendaftaranKelas ?? []}
          />

          {/* <DataTable
            filterColumnId="programKelas"
            filterColumnPlaceholder="Filter Nama Program Kelas..."
            columns={columnsPendaftaran}
            data={dataPendaftaranKelas ?? []}
            toolbar={(table) => (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Cari nama cabang..."
                  value={
                    (table
                      .getColumn("namaCabang")
                      ?.getFilterValue() as string) ?? ""
                  }
                  onChange={(event) =>
                    table
                      .getColumn("namaCabang")
                      ?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
              </div>
            )}
          /> */}
        </div>
      </TabsContent>
    </Tabs>
  );
}
