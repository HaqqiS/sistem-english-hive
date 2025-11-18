"use client";

// import { DataTable } from "@/app/_components/shared/data-table";
import { DataTable } from "@/app/_components/shared/data-table-generic";
import { columns as kelas } from "./columns/columns-kelas";
import { columns as columnsMurid } from "../siswa/columns-murid-not-registered";
import type { TypeKelas } from "@/types/kelas.type";
import TambahProgramKelas from "./drawers/tambah-kelas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TambahPendaftaranKelas from "../siswa/tambah-pendaftaran-kelas";
import { useKelas } from "@/hooks/useKelas";
import { useState } from "react";
import { useGuruKelasStore, useKelasStore } from "@/store/useKelasStore";
import EditKelas from "./drawers/edit-kelas";
import EditGuruKelas from "./drawers/edit-guru-kelas";
import type { TypeHistoryGuruKelas } from "@/types/historyGuruKelas.type";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import type { TypeMuridNotRegistered } from "@/types/murid.type";
import { useMurid } from "@/hooks/useMurid";
import { toast } from "sonner";
import TambahJadwalKelas from "../jadwal/tambah-jadwal";
import RangkumanSesiTab from "./tabs/rangkuman-sesi-tab";

interface ProgramKelasClientProps {
  initialDataKelas: TypeKelas[];
  initialDataMuridNotRegistered: TypeMuridNotRegistered[];
}

export default function KelasClient({
  initialDataKelas,
  initialDataMuridNotRegistered,
}: ProgramKelasClientProps) {
  const { openDrawer: openKelasDrawer } = useKelasStore();
  const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();

  const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
  const [selectedKelasToDelete, setSelectedKelasToDelete] =
    useState<TypeKelas | null>(null);

  const { data: dataKelas, mutations: kelasMutations } = useKelas({
    initialData: initialDataKelas,
    onSuccessDelete: () => {
      setDeleteKelasDialogOpen(false);
      setSelectedKelasToDelete(null);
    },
  });
  const { dataMuridNotRegistered } = useMurid({
    initialDataNotRegistered: initialDataMuridNotRegistered,
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
    onDeleteClick: (kelasId, kodeKelas) => {
      console.log("deleted: ", kelasId, kodeKelas);
      handleDeleteClickKelas(kelasId, kodeKelas);
    },
  });

  const columnsPendaftaran = columnsMurid({
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
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
