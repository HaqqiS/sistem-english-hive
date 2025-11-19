"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { useKelas } from "@/hooks/useKelas";
import { useParams } from "next/navigation";
import { columns as murid } from "../columns/columns-list-murid";
import { columns as guru } from "../columns/columns-list-guru";
import TambahMuridDetailKelas from "../drawers/tambah-murid";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";
import TambahGuruKelas from "../drawers/tambah-guru-kelas";
import EditGuruKelas from "../drawers/edit-guru-kelas";
import {
  useGuruKelasStore,
  usePendaftaranKelasStore,
} from "@/store/useKelasStore";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit } from "lucide-react";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import EditMuridDetailKelas from "../drawers/edit-murid";

export default function DetailKelasClient() {
  // STATE
  const [
    deletePendaftaranKelasDialogOpen,
    setDeletePendaftaranKelasDialogOpen,
  ] = useState(false);
  const [
    selectedPendaftaranKelasToDelete,
    setSelectedPendaftaranKelasToDelete,
  ] = useState<{ id: string; namaMurid: string } | null>(null);

  const [
    deleteHistoryGuruKelasDialogOpen,
    setDeleteHistoryGuruKelasDialogOpen,
  ] = useState(false);
  const [
    selectedHistoryGuruKelasToDelete,
    setSelectedHistoryGuruKelasToDelete,
  ] = useState<{ id: string; namaGuru: string } | null>(null);

  const { openDrawer: openGuruDrawer } = useGuruKelasStore();
  const { openDrawer: openPendaftaranDrawer } = usePendaftaranKelasStore();

  const { kelasId } = useParams<{ kelasId: string }>();

  //HOOKS/QUERIES&MUTATIONS
  const { dataById } = useKelas({ kelasId });

  const { dataByKelasId, mutations: pendaftaranKelasMutations } =
    usePendaftaranKelas({
      enableQuery: !!kelasId,
      kelasId,
      onSuccessDelete() {
        setDeletePendaftaranKelasDialogOpen(false);
        setSelectedPendaftaranKelasToDelete(null);
      },
    });

  const {
    dataById: dataGuruByKelasId,
    isLoadingById: loadingGuru,
    mutations: historyGuruKelasMutations,
  } = UseHistoryGuruKelas({
    kelasId,
    enableQuery: !!kelasId,
    onSuccessDelete() {
      setDeleteHistoryGuruKelasDialogOpen(false);
      setSelectedHistoryGuruKelasToDelete(null);
    },
  });

  const activeGuruHistory = useMemo(
    () => dataGuruByKelasId?.find((h) => h.statusGuru === "ACTIVE"),
    [dataGuruByKelasId],
  );

  // HANDLERS
  const handleOpenEditDrawer = () => {
    if (activeGuruHistory) {
      openGuruDrawer("edit", activeGuruHistory);
    }
  };

  const handleConfirmDeletePendaftaranKelas = () => {
    if (!selectedPendaftaranKelasToDelete) return;
    pendaftaranKelasMutations.delete.mutate({
      id: selectedPendaftaranKelasToDelete.id,
    });
  };

  const handleConfirmDeleteGuruKelas = () => {
    if (!selectedHistoryGuruKelasToDelete) return;
    historyGuruKelasMutations.delete.mutate({
      id: selectedHistoryGuruKelasToDelete.id,
      kelasId: kelasId,
    });
  };

  // COLUMNS
  const columnsMurid = murid({
    onEditClick: (item) => {
      console.log("Edit clicked for:", item);
      openPendaftaranDrawer("edit", item);
    },
    onDeleteClick: (id, namaLengkap) => {
      // console.log(`Delete clicked for ID: ${id}, Name: ${namaLengkap}`);
      setSelectedPendaftaranKelasToDelete({ id, namaMurid: namaLengkap });
      setDeletePendaftaranKelasDialogOpen(true);
    },
  });

  const columnsGuru = guru({
    onEditClick: (item) => {
      openGuruDrawer("edit", item);
    },
    onDeleteClick: (id, namaGuru) => {
      // console.log(`Delete clicked for ID: ${id}, Name: ${namaGuru}`);
      setSelectedHistoryGuruKelasToDelete({ id, namaGuru });
      setDeleteHistoryGuruKelasDialogOpen(true);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between space-x-2 pt-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl">
              List Murid Dari kelas {dataById?.kodeKelas}
            </h1>
            <p className="text-muted-foreground text-sm">
              This is the kelas management page.
            </p>
          </div>
        </header>
        <TambahMuridDetailKelas kelasId={kelasId} />
        <EditMuridDetailKelas />

        <DeleteConfirmationDialog
          isOpen={deletePendaftaranKelasDialogOpen}
          onOpenChange={setDeletePendaftaranKelasDialogOpen}
          title="Hapus Murid dari Kelas"
          description={
            <>
              Yakin ingin menghapus murid{" "}
              <span className="text-accent font-bold">
                {selectedPendaftaranKelasToDelete?.namaMurid}
              </span>{" "}
              dari kelas ? Tindakan ini tidak dapat dibatalkan.
            </>
          }
          onConfirm={handleConfirmDeletePendaftaranKelas}
          isLoading={pendaftaranKelasMutations.delete.isPending}
          confirmText="Hapus"
          cancelText="Batal"
        />
      </div>

      <DataTable data={dataByKelasId ?? []} columns={columnsMurid} />

      <div className="flex items-center justify-between space-x-2 pt-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl">
              History Guru Kelas {dataById?.kodeKelas}
            </h1>
            <p className="text-muted-foreground text-sm">
              This is the kelas management page.
            </p>
          </div>
        </header>

        <EditGuruKelas />
        {loadingGuru ? (
          // Tampilkan skeleton saat loading
          <Skeleton className="h-9 w-32 rounded-md" />
        ) : activeGuruHistory ? (
          // Jika ADA guru aktif, tampilkan tombol Edit
          <Button variant="outline" onClick={handleOpenEditDrawer}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Guru Aktif
          </Button>
        ) : (
          // Jika TIDAK ADA guru aktif, tampilkan komponen Tambah
          <TambahGuruKelas kelasId={kelasId} />
        )}
        <DeleteConfirmationDialog
          isOpen={deleteHistoryGuruKelasDialogOpen}
          onOpenChange={setDeleteHistoryGuruKelasDialogOpen}
          title="Hapus History Guru Kelas"
          description={
            <>
              Yakin ingin menghapus History Guru{" "}
              <span className="text-accent font-bold">
                {selectedHistoryGuruKelasToDelete?.namaGuru}
              </span>{" "}
              dari kelas ? Tindakan ini tidak dapat dibatalkan.
            </>
          }
          onConfirm={handleConfirmDeleteGuruKelas}
          isLoading={historyGuruKelasMutations.delete.isPending}
          confirmText="Hapus"
          cancelText="Batal"
        />
      </div>

      <DataTable data={dataGuruByKelasId ?? []} columns={columnsGuru} />
    </div>
  );
}
