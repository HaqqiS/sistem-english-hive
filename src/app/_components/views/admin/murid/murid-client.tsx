"use client";

import { DataTable as DataTablePagination } from "@/app/_components/shared/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { TypeAllMurid, TypeMuridNotRegistered } from "@/types/murid.type";
import { useMurid } from "@/hooks/useMurid";
import { columns as createColumnsMuridNotRegistered } from "./columns/columns-murid-not-registered";
import { columns as createColumnsAllMurid } from "./columns/columns-murid";
import TambahPendaftaranKelas from "./drawer/tambah-pendaftaran-kelas";
import RegistrasiMurid from "./drawer/registrasi-murid";
import EditMurid from "./drawer/edit-murid";
import { useMuridStore } from "@/store/useMuridStore";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import EditMuridNotRegistered from "./drawer/edit-murid-not-registered";
import type { PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MuridClient() {
  // STATE
  const [paginationAllMurid, setPaginationAllMurid] = useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 10,
    },
  );
  const [paginationNotRegistered, setPaginationNotRegistered] =
    useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });

  const [deleteMuridDialogOpen, setDeleteMuridDialogOpen] = useState(false);
  const [selectedMuridToDelete, setSelectedMuridToDelete] = useState<{
    id: string;
    namaLengkap: string;
  } | null>(null);

  const { openDrawer } = useMuridStore();

  // HOOKS/QUERIES&MUTATIONS
  const {
    dataNotRegisteredPaginated,
    pageCountNotRegistered,
    totalRowsNotRegistered,
    isLoadingNotRegisteredPaginated,
    isFetchingNotRegisteredPaginated,
    refetchNotRegisteredPaginated,
  } = useMurid({
    pagination: paginationNotRegistered, // Pass pagination state ke hook
  });

  const {
    dataAllMuridPaginated,
    pageCount,
    totalRows,
    isLoadingAllMuridPaginated,
    isFetchingAllMuridPaginated,
    refetchPaginated,
    mutations,
  } = useMurid({
    pagination: paginationAllMurid, // Pass pagination state ke hook
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

  const handleEditNotRegistered = (item: TypeMuridNotRegistered) => {
    // Cast to TypeAllMurid to satisfy store type, as they share base fields
    openDrawer("edit-status", item as unknown as TypeAllMurid);
  };

  const columnsMuridNotRegistered = createColumnsMuridNotRegistered({
    onEditStatusClick: (item) => {
      handleEditNotRegistered(item);
    },
    onDeleteClick: (pendaftaranId) => {
      console.log("deleted");
    },
  });

  const columnsAllMurid = createColumnsAllMurid({
    onEditClick: (item) => {
      openDrawer("edit", item);
    },
    onEditStatusClick: (item) => {
      handleEditNotRegistered(item);
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
            <header className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={
                  isLoadingNotRegisteredPaginated ||
                  isFetchingNotRegisteredPaginated
                }
                onClick={() => refetchNotRegisteredPaginated()}
                title="Refresh Jadwal"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    (isLoadingNotRegisteredPaginated ||
                      isFetchingNotRegisteredPaginated) &&
                      "animate-spin",
                  )}
                />
              </Button>
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

          <DataTablePagination
            columns={columnsMuridNotRegistered}
            data={dataNotRegisteredPaginated ?? []}
            pageCount={pageCountNotRegistered}
            pagination={paginationNotRegistered}
            onPaginationChange={setPaginationNotRegistered}
            isLoading={isFetchingNotRegisteredPaginated}
          />
        </div>
      </TabsContent>

      <TabsContent value="listMurid">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={
                  isLoadingAllMuridPaginated || isFetchingAllMuridPaginated
                }
                onClick={() => refetchPaginated()}
                title="Refresh Jadwal"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    (isLoadingAllMuridPaginated ||
                      isFetchingAllMuridPaginated) &&
                      "animate-spin",
                  )}
                />
              </Button>

              <div>
                <h1 className="text-xl">Daftar Murid</h1>
                <p className="text-muted-foreground text-sm">
                  Halaman ini menampilkan daftar semua murid.
                </p>
                <div className="text-muted-foreground text-xs font-medium">
                  Total Data:{" "}
                  <span className="text-foreground">{totalRows}</span> Murid
                </div>
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

          <DataTablePagination
            columns={columnsAllMurid}
            data={dataAllMuridPaginated}
            pageCount={pageCount}
            pagination={paginationAllMurid}
            onPaginationChange={setPaginationAllMurid}
            isLoading={isFetchingAllMuridPaginated}
          />
        </div>
      </TabsContent>
      <EditMuridNotRegistered />
    </Tabs>
  );
}
