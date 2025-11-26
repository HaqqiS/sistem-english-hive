"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { columns as kelas } from "./columns/columns-kelas";
import { columns as jadwal } from "./columns/columns-jadwal";
import type { TypeKelas } from "@/types/kelas.type";
import TambahProgramKelas from "./drawers/tambah-kelas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKelas } from "@/hooks/useKelas";
import { useState } from "react";
import { useGuruKelasStore, useKelasStore } from "@/store/useKelasStore";
import EditKelas from "./drawers/edit-kelas";
import EditGuruKelas from "./drawers/edit-guru-kelas";
import type { TypeHistoryGuruKelas } from "@/types/historyGuruKelas.type";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import TambahJadwalKelas from "../jadwal/tambah-jadwal";
import RangkumanSesiTab from "./tabs/rangkuman-sesi-tab";
import UpLevelKelas from "./drawers/up-level-kelas";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import type { TypeJadwalKelas } from "@/types/jadwalKelas.type";
import { toast } from "sonner";

interface ProgramKelasClientProps {
  initialDataKelas: TypeKelas[];
  initialDataJadwal: TypeJadwalKelas[];
}

export default function KelasClient({
  initialDataKelas,
  initialDataJadwal,
}: ProgramKelasClientProps) {
  const { openDrawer: openKelasDrawer } = useKelasStore();
  const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();

  const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
  const [selectedKelasToDelete, setSelectedKelasToDelete] =
    useState<TypeKelas | null>(null);

  const [deleteJadwalDialogOpen, setDeleteJadwalDialogOpen] = useState(false);
  const [selectedJadwalToDelete, setSelectedJadwalToDelete] = useState<{
    id: string;
    deskripsi: string;
  } | null>(null);

  const { dataKelasAktif: dataKelas, mutations: kelasMutations } = useKelas({
    initialData: initialDataKelas,
    onSuccessDelete: () => {
      setDeleteKelasDialogOpen(false);
      setSelectedKelasToDelete(null);
    },
  });
  const { dataJadwal, mutations: jadwalMutation } = useJadwalKelas({
    initialData: initialDataJadwal,
    onSuccessDelete: () => {
      setDeleteJadwalDialogOpen(false);
      setSelectedJadwalToDelete(null);
    },
  });

  const handleEditClickKelas = (item: TypeKelas) => {
    openKelasDrawer("edit", item);
  };

  const handleEditClickGuruKelas = (item: TypeHistoryGuruKelas) => {
    openGuruKelasDrawer("edit", item);
  };

  const handleDeleteClickKelas = (id: string, kodeKelas: string) => {
    const kelas = initialDataKelas.find((c) => c.id === id);
    if (kelas) {
      setSelectedKelasToDelete(kelas);
      setDeleteKelasDialogOpen(true);
    }
  };
  const handleConfirmDeleteKelas = async () => {
    if (!selectedKelasToDelete) return;

    await kelasMutations.delete.mutateAsync({ id: selectedKelasToDelete.id });
  };

  const handleConfirmDeleteJadwal = async () => {
    if (!selectedJadwalToDelete) return;

    await jadwalMutation.delete.mutateAsync({ id: selectedJadwalToDelete.id });
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
        handleEditClickGuruKelas(history as unknown as TypeHistoryGuruKelas);
      } else {
        // no history available for this kelas
        toast.error("Tidak ada data guru untuk kelas ini.", {
          richColors: true,
        });
      }
    },
    onUpLevelClick: (item) => {
      // console.log("up level: ", item);
      openKelasDrawer("upLevel", item);
    },
    onDeleteClick: (kelasId, kodeKelas) => {
      console.log("deleted: ", kelasId, kodeKelas);
      handleDeleteClickKelas(kelasId, kodeKelas);
    },
  });

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
    <Tabs defaultValue="kelas">
      <TabsList>
        <TabsTrigger value="kelas">Kelola Kelas</TabsTrigger>
        <TabsTrigger value="rangkumanSesi">Rangkuman Sesi</TabsTrigger>
        <TabsTrigger value="penjadwalanKelas">Penjadwalan Kelas</TabsTrigger>
      </TabsList>
      <TabsContent value="kelas">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">Daftar Kelas</h1>
                <p className="text-muted-foreground text-sm">
                  halaman ini mengatur data kelas dan penugasan guru.
                </p>
              </div>
            </header>
            <TambahProgramKelas />

            <DeleteConfirmationDialog
              isOpen={deleteKelasDialogOpen}
              onOpenChange={setDeleteKelasDialogOpen}
              title="Hapus Kelas"
              description={
                <>
                  Yakin ingin menghapus Kelas{" "}
                  <span className="text-accent font-bold">
                    {selectedKelasToDelete?.kodeKelas}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </>
              }
              onConfirm={handleConfirmDeleteKelas}
              isLoading={kelasMutations.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>

          <EditKelas />
          <EditGuruKelas />
          <UpLevelKelas />

          <DataTable columns={columnsKelas} data={dataKelas ?? []} />
        </div>
      </TabsContent>

      <TabsContent value="rangkumanSesi">
        <RangkumanSesiTab />
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
