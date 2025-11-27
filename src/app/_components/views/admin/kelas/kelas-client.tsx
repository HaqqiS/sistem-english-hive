"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { columns as jadwal } from "./columns/columns-jadwal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKelas } from "@/hooks/useKelas";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import TambahJadwalKelas from "../jadwal/tambah-jadwal";
import KelasTab from "./tabs/kelas-tab";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";

export default function KelasClient() {
  // const { openDrawer: openKelasDrawer } = useKelasStore();
  // const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();

  // const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
  // const [selectedKelasToDelete, setSelectedKelasToDelete] =
  //   useState<TypeKelas | null>(null);

  const [deleteJadwalDialogOpen, setDeleteJadwalDialogOpen] = useState(false);
  const [selectedJadwalToDelete, setSelectedJadwalToDelete] = useState<{
    id: string;
    deskripsi: string;
  } | null>(null);

  const { dataKelasAktif: dataKelas, mutations: kelasMutations } = useKelas({
    enableQueryGetAll: false,
    enableQueryGetKelasCount: false,
    enableQueryGetKelasId: true,
  });
  const { dataJadwal, mutations: jadwalMutation } = useJadwalKelas({
    onSuccessDelete: () => {
      setDeleteJadwalDialogOpen(false);
      setSelectedJadwalToDelete(null);
    },
  });

  const handleConfirmDeleteJadwal = async () => {
    if (!selectedJadwalToDelete) return;

    await jadwalMutation.delete.mutateAsync({ id: selectedJadwalToDelete.id });
  };

  const columnsJadwal = jadwal({
    onEditClick: (item) => {
      console.log("edit jadwal: ", item);
    },
    onDeleteClick: (id, deskripsi) => {
      setSelectedJadwalToDelete({ id, deskripsi });
      setDeleteJadwalDialogOpen(true);
    },
  });

  return (
    <Tabs defaultValue="listKelas">
      <TabsList>
        <TabsTrigger value="listKelas">List Kelas</TabsTrigger>
        <TabsTrigger value="penjadwalanKelas">Penjadwalan Kelas</TabsTrigger>
      </TabsList>
      <TabsContent value="listKelas">
        <KelasTab />
      </TabsContent>
      <TabsContent value="penjadwalanKelas">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">Daftar jadwal Kelas</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini mengatur data jadwal kelas.
                </p>
              </div>
            </header>

            <TambahJadwalKelas />
            <DeleteConfirmationDialog
              isOpen={deleteJadwalDialogOpen}
              onOpenChange={setDeleteJadwalDialogOpen}
              title="Hapus Jadwal Kelas"
              description={
                <>
                  Yakin ingin menghapus Jadwal Kelas{" "}
                  <span className="text-accent font-bold">
                    {selectedJadwalToDelete?.deskripsi}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </>
              }
              onConfirm={handleConfirmDeleteJadwal}
              isLoading={jadwalMutation.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>

          <DataTable columns={columnsJadwal} data={dataJadwal ?? []} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
