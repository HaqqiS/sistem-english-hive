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
import { useState } from "react";
import { useGuruKelasStore, useKelasStore } from "@/store/useKelasStore";
import EditKelas from "./drawers/edit-kelas";
import EditGuruKelas from "./drawers/edit-guru-kelas";
import type { HistoryGuruKelasType } from "@/types/historyGuruKelas.type";

interface ProgramKelasClientProps {
  initialDataProgram: KelasType[];
  initialDataPendaftaran: PendaftaranKelasType[];
}

export default function KelasClient({
  initialDataProgram,
  initialDataPendaftaran,
}: ProgramKelasClientProps) {
  const { data: dataKelas } = useKelas({
    initialData: initialDataProgram,
  });
  const { openDrawer: openKelasDrawer } = useKelasStore();
  const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();

  const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
  const [selectedKelasToDelete, setSelectedKelasToDelete] =
    useState<KelasType | null>(null);

  const { data: dataPendaftaranKelas } = usePendaftaranKelas({
    initialData: initialDataPendaftaran,
  });

  const handleEditClickKelas = (item: KelasType) => {
    openKelasDrawer("edit", item);
  };

  const handleEditClickGuruKelas = (item: HistoryGuruKelasType) => {
    openGuruKelasDrawer("edit", item);
  };

  const handleDeleteClickKelas = (id: string, nama: string) => {
    // const kelas = dataKelas.find((c) => c.id === id);
    const kelas = initialDataProgram.find((c) => c.id === id);
    if (kelas) {
      setSelectedKelasToDelete(kelas);
      setDeleteKelasDialogOpen(true);
    }
  };

  const columnsKelas = kelas({
    onEditKelasClick: (item) => {
      handleEditClickKelas(item);
    },
    onEditGuruKelasClick: (item) => {
      const history = item.historyGuruKelases?.[0];
      if (history) {
        // assert to the expected type after guarding against undefined
        // cast via unknown first to avoid incompatible structural typing error
        handleEditClickGuruKelas(history as unknown as HistoryGuruKelasType);
      } else {
        // no history available for this kelas
        console.warn("No historyGuruKelases entry found for this item");
      }
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
    <Tabs defaultValue="kelas">
      <TabsList>
        <TabsTrigger value="kelas">Kelola Kelas</TabsTrigger>
        <TabsTrigger value="pendaftaranKelas">
          Pendaftaran Siswa ke Kelas
        </TabsTrigger>
      </TabsList>
      <TabsContent value="kelas">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">Kelola Kelas</h1>
                <p className="text-muted-foreground text-sm">
                  This is the kelas management page.
                </p>
              </div>
            </header>
            <TambahProgramKelas />
          </div>

          <EditKelas />

          <EditGuruKelas />

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
                <h1 className="text-xl">Kelola Pendaftaran Siswa ke Kelas</h1>
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
