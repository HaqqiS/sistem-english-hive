"use client";

import { DataTable as DataTablePagination } from "@/app/_components/shared/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
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
import { FileSpreadsheet, Filter, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusMurid } from "@prisma/client";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { downloadCSV } from "@/utils/exportUtils";
import { toast } from "sonner";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusMurid | "ALL">("ALL");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPaginationAllMurid((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    pagination: paginationNotRegistered,
  });

  const {
    dataAllMuridPaginated,
    pageCount,
    totalRows,
    isLoadingAllMuridPaginated,
    isFetchingAllMuridPaginated,
    refetchPaginated,
    fetchExportData,
    mutations,
  } = useMurid({
    pagination: paginationAllMurid,
    searchFilter: debouncedSearch,
    filterStatus: statusFilter,
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

  const handleExport = async () => {
    const toastId = toast.loading("Mengunduh data murid...");
    try {
      const data = await fetchExportData();

      if (!data || data.length === 0) {
        toast.error("Tidak ada data murid yang sesuai filter.", {
          id: toastId,
        });
        return;
      }

      // Format CSV
      const csvData = data.map((m) => ({
        "Nama Lengkap": m.namaLengkap,
        "No. WA": m.noWA ? `'${m.noWA}` : "-", // Tambah kutip agar excel baca text (bukan angka ilmiah)
        Email: m.email,
        "Asal Sekolah": m.asalSekolah,
        "Kelas Sekolah": m.kelasSekolah,
        "Program Minat": m.pilihanProgram ?? "-",
        Status: m.statusMurid,
        "Tanggal Gabung": formatDateToYYYYMMDD(m.createdAt),
      }));

      const filename = `Database-Murid-${statusFilter}-${new Date().toISOString().split("T")[0]}`;
      downloadCSV(csvData, filename);

      toast.success("Export berhasil!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Gagal export data.", { id: toastId });
    }
  };

  // COLUMNS
  const columnsMuridNotRegistered = createColumnsMuridNotRegistered({
    onEditStatusClick: (item) => {
      handleEditNotRegistered(item);
    },
    onDeleteClick: (pendaftaranId) => {
      console.log("deleted", pendaftaranId);
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
        <HeaderActionPortal>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Database
          </Button>
        </HeaderActionPortal>

        <div>
          <div className="mb-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <header className="flex w-full items-center justify-between">
              <div className="flex flex-col justify-between gap-2">
                <div className="flex items-center gap-2">
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
                      Halaman ini menampilkan daftar semua murid. Total Data:{" "}
                      <span className="text-foreground">{totalRows}</span> Murid
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative w-full sm:w-60">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <Input
                      placeholder="Cari nama murid..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filter Status */}
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val as StatusMurid | "ALL");
                      setPaginationAllMurid((prev) => ({
                        ...prev,
                        pageIndex: 0,
                      })); // Reset page
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Status</SelectItem>
                      <SelectItem value={StatusMurid.AKTIF}>Aktif</SelectItem>
                      <SelectItem value={StatusMurid.NON_AKTIF}>
                        Non-Aktif
                      </SelectItem>
                      <SelectItem value={StatusMurid.TRIAL}>Trial</SelectItem>
                      <SelectItem value={StatusMurid.LULUS}>Lulus</SelectItem>
                    </SelectContent>
                  </Select>
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
