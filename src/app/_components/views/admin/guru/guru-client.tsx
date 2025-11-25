"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DataTable as DataTablePagination } from "@/app/_components/shared/data-table";
import { columns as columnsAbsen } from "./columns/columns-absen-guru";
import { columns as columnsGuru } from "./columns/columns-guru";
import type {
  TypeAbsensiGuru,
  TypeAbsensiGuruPaginated,
} from "@/types/absenGuru.type";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import EditVerifikasiAbsen from "./drawer/edit-verifikasi-absen";
import { useAbsenGuruStore, useGuruStore } from "@/store/useGuruStore";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { useState } from "react";
import RegistrasiGuru from "./drawer/registrasi-guru";
import EditGuru from "./drawer/edit-guru";
import type { PaginationState } from "@tanstack/react-table";
import type { TypeGuruComplete } from "@/types/user.type";

interface GuruClientProps {
  initialDataAbsensi: TypeAbsensiGuruPaginated;
  initialDataGuru: TypeGuruComplete[];
}

export default function GuruClient({
  initialDataAbsensi,
  initialDataGuru,
}: GuruClientProps) {
  // STATE
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [deleteAbsenGuruDialogOpen, setDeleteAbsenGuruDialogOpen] =
    useState(false);
  const [selectedAbsenGuruToDelete, setSelectedAbsenGuruToDelete] = useState<{
    kodeKelasTanggalWaktu: string;
    id: string;
  } | null>(null);

  const [deleteGuruDialogOpen, setDeleteGuruDialogOpen] = useState(false);
  const [selectedGuruToDelete, setSelectedGuruToDelete] = useState<{
    namaGuru: string;
    id: string;
  } | null>(null);
  const [resetPasswordGuruDialogOpen, setResetPasswordGuruDialogOpen] =
    useState(false);

  const { openDrawer: openAbsenDrawer } = useAbsenGuruStore();
  const { openDrawer: openGuruDrawer } = useGuruStore();

  // HOOKS/MUTATIONS&QUERIES
  const {
    data: dataAbsensiGuru,
    pageCount,
    mutations: mutationsAbsenGuru,
  } = useAbsenGuru({
    initialDataAbsensi: initialDataAbsensi,
    pagination: pagination,
    onSuccessDelete: () => {
      setDeleteAbsenGuruDialogOpen(false);
      setSelectedAbsenGuruToDelete(null);
    },
    onSuccessUpdateStatus: () => {
      setPendingId(null);
    },
  });

  const { dataComplete: dataGuru, mutations: mutationsGuru } = useUser({
    initialDataGuruComplete: initialDataGuru,
    onSuccessDelete() {
      setDeleteGuruDialogOpen(false);
      setSelectedGuruToDelete(null);
    },
    onSuccessResetPassword() {
      setResetPasswordGuruDialogOpen(false);
      setSelectedGuruToDelete(null);
    },
  });

  // HANDLERS
  const handleDeleteClickAbsenGuru = (
    id: string,
    kodeKelasTanggalWaktu: string,
  ) => {
    setSelectedAbsenGuruToDelete({ id, kodeKelasTanggalWaktu });
    setDeleteAbsenGuruDialogOpen(true);
  };

  const handleConfirmDeleteAbsenGuru = () => {
    if (!selectedAbsenGuruToDelete) return;
    mutationsAbsenGuru.delete.mutate({ id: selectedAbsenGuruToDelete.id });
  };

  const handleStatusChange = (item: TypeAbsensiGuru, status: boolean) => {
    setPendingId(item.id);
    mutationsAbsenGuru.updateStatus.mutate(
      {
        absensiId: item.id,
        isVerified: status,
      },
      {
        onSettled: () => {
          setPendingId(null);
        },
      },
    );
  };

  const handleConfirmDeleteGuru = () => {
    if (!selectedGuruToDelete) return;
    mutationsGuru.delete.mutate({ id: selectedGuruToDelete.id });
  };

  const handleConfirmResetPasswordGuru = () => {
    if (!selectedGuruToDelete) return;
    mutationsGuru.resetPassword.mutate({ id: selectedGuruToDelete.id });
  };

  // COLUMNS
  const columnsAbsensiGuru = columnsAbsen({
    onEditClick: (item) => {
      console.log(item);
      openAbsenDrawer("edit", item);
    },
    onDeleteClick: (id, kodeKelasTanggalWaktu) => {
      handleDeleteClickAbsenGuru(id, kodeKelasTanggalWaktu);
    },
    onStatusChange: (item, status) => {
      handleStatusChange(item, status);
    },
    pendingId: pendingId,
  });

  const columnsListGuru = columnsGuru({
    onEditClick: (item) => {
      openGuruDrawer("edit", item);
    },
    onResetPasswordClick: (id, namaGuru) => {
      setSelectedGuruToDelete({ id, namaGuru });
      setResetPasswordGuruDialogOpen(true);
    },
    onDeleteClick: (id, namaGuru) => {
      setSelectedGuruToDelete({ id, namaGuru });
      setDeleteGuruDialogOpen(true);
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

            <EditVerifikasiAbsen />
            <DeleteConfirmationDialog
              isOpen={deleteAbsenGuruDialogOpen}
              onOpenChange={setDeleteAbsenGuruDialogOpen}
              title="Hapus Absen Guru"
              description={
                <>
                  Yakin ingin menghapus Absen Guru{" "}
                  <span className="text-accent font-bold">
                    {selectedAbsenGuruToDelete?.kodeKelasTanggalWaktu}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </>
              }
              onConfirm={handleConfirmDeleteAbsenGuru}
              isLoading={mutationsAbsenGuru.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
          </div>
        </div>

        <DataTablePagination
          columns={columnsAbsensiGuru}
          data={dataAbsensiGuru ?? []}
          // Tambahkan props pagination ke DataTable
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={pageCount}
        />
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

            <RegistrasiGuru />
            <EditGuru />
            <DeleteConfirmationDialog
              isOpen={deleteGuruDialogOpen}
              onOpenChange={setDeleteGuruDialogOpen}
              title="Hapus Akun Guru"
              description={
                <>
                  Yakin ingin menghapus Akun Guru{" "}
                  <span className="text-accent font-bold">
                    {selectedGuruToDelete?.namaGuru}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </>
              }
              onConfirm={handleConfirmDeleteGuru}
              isLoading={mutationsGuru.delete.isPending}
              confirmText="Hapus"
              cancelText="Batal"
            />
            <DeleteConfirmationDialog
              isOpen={resetPasswordGuruDialogOpen}
              onOpenChange={setResetPasswordGuruDialogOpen}
              title="Reset Password Guru"
              description={
                <>
                  Yakin ingin mereset password Akun Guru{" "}
                  <span className="text-accent font-bold">
                    {selectedGuruToDelete?.namaGuru}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan. password akan direset
                  menjadi{" "}
                  <span className="text-accent font-bold">password123</span>
                </>
              }
              onConfirm={handleConfirmResetPasswordGuru}
              isLoading={mutationsGuru.resetPassword.isPending}
              confirmText="Reset Password"
              cancelText="Batal"
            />
          </div>
        </div>

        <DataTable columns={columnsListGuru} data={dataGuru ?? []} />
      </TabsContent>
    </Tabs>
  );
}
