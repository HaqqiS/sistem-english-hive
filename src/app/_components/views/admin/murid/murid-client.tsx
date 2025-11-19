"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import type { TypeKelas } from "@/types/kelas.type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { TypeAllMurid, TypeMuridNotRegistered } from "@/types/murid.type";
import { useMurid } from "@/hooks/useMurid";
import { columns as createColumnsMuridNotRegistered } from "./columns/columns-murid-not-registered";
import { columns as createColumnsAllMurid } from "./columns/columsn-murid";
import TambahPendaftaranKelas from "./drawer/tambah-pendaftaran-kelas";
import RegistrasiMurid from "./drawer/registrasi-murid";
import EditMurid from "./drawer/edit-murid";
import { useMuridStore } from "@/store/useMuridStore";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";

interface ProgramMuridClientProps {
  initialDataMuridNotRegistered: TypeMuridNotRegistered[];
  initialDataAllMurid: TypeAllMurid[];
}

export default function MuridClient({
  initialDataMuridNotRegistered,
  initialDataAllMurid,
}: ProgramMuridClientProps) {
  // STATE
  const [deleteMuridDialogOpen, setDeleteMuridDialogOpen] = useState(false);
  const [selectedMuridToDelete, setSelectedMuridToDelete] = useState<{
    id: string;
    namaLengkap: string;
  } | null>(null);

  const { openDrawer } = useMuridStore();

  // HOOKS/QUERIES&MUTATIONS
  const { dataMuridNotRegistered } = useMurid({
    initialDataNotRegistered: initialDataMuridNotRegistered,
  });

  const { dataAllMurid, mutations } = useMurid({
    initialDataAllMurid: initialDataAllMurid,
    onSuccessDelete: () => {
      setDeleteMuridDialogOpen(false);
      setSelectedMuridToDelete(null);
    },
  });

  // HANDLERS
  const handleConfirmDeleteMurid = () => {
    if (!selectedMuridToDelete) return;
    mutations.delete.mutate({ id: selectedMuridToDelete.id });
    setSelectedMuridToDelete(null);
  };

  const columnsMuridNotRegistered = createColumnsMuridNotRegistered({
    onEditClick: (item) => {
      console.log("clicked");
    },
    onDeleteClick: (pendaftaranId) => {
      console.log("deleted");
    },
  });

  const columnsAllMurid = createColumnsAllMurid({
    onEditClick: (item) => {
      openDrawer("edit", item);
    },
    onDeleteClick: (id, namaLengkap) => {
      setSelectedMuridToDelete({ id, namaLengkap });
      setDeleteMuridDialogOpen(true);
    },
  });

  return (
    <Tabs defaultValue="daftarMurid">
      <TabsList>
        <TabsTrigger value="daftarMurid">
          Pendaftaran Murid ke Kelas
        </TabsTrigger>
        <TabsTrigger value="listMurid">List Semua Murid</TabsTrigger>
      </TabsList>
      <TabsContent value="daftarMurid">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">
                  Daftar Murid Belum Terdaftar ke Kelas
                </h1>
                <p className="text-muted-foreground text-sm">
                  Halaman ini menampilkan daftar murid yang belum terdaftar ke
                  kelas.
                </p>
              </div>
            </header>
            <TambahPendaftaranKelas />
          </div>

          <DataTable
            columns={columnsMuridNotRegistered}
            data={dataMuridNotRegistered ?? []}
          />
        </div>
      </TabsContent>

      <TabsContent value="listMurid">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">Daftar Murid</h1>
                <p className="text-muted-foreground text-sm">
                  Halaman ini menampilkan daftar semua murid.
                </p>
              </div>
            </header>
            <RegistrasiMurid />

            <EditMurid />
            <DeleteConfirmationDialog
              isOpen={deleteMuridDialogOpen}
              onOpenChange={setDeleteMuridDialogOpen}
              title="Hapus Murid"
              description={
                <>
                  Yakin ingin menghapus Murid{" "}
                  <span className="text-accent font-bold">
                    {selectedMuridToDelete?.namaLengkap}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </>
              }
              onConfirm={handleConfirmDeleteMurid}
              isLoading={mutations.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>

          <DataTable columns={columnsAllMurid} data={dataAllMurid ?? []} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
