"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { DataTable as DataTablePagination } from "@/app/_components/shared/data-table";
import { columns as columnsAbsen } from "./columns/columns-absen-guru";
import { columns as columnsGuru } from "./columns/columns-guru";
import type { TypeAbsensiGuru } from "@/types/absenGuru.type";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import EditVerifikasiAbsen from "./drawer/edit-verifikasi-absen";
import { useAbsenGuruStore, useGuruStore } from "@/store/useGuruStore";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { useEffect, useMemo, useState } from "react";
import RegistrasiGuru from "./drawer/registrasi-guru";
import EditGuru from "./drawer/edit-guru";
import type { PaginationState } from "@tanstack/react-table";
import { HeaderActionPortal } from "@/app/_components/shared/header-action-portal";
import {
  CalendarIcon,
  FileSpreadsheet,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import dayjs, { formatToWITA } from "@/utils/dateUtils";
import { downloadCSV } from "@/utils/exportUtils";
import { getPeriodeGaji } from "@/server/services/gaji.service";
import { Calendar } from "@/components/ui/calendar";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";

export default function GuruClient() {
  // STATES
  const { activeCabangId } = useGlobalCabangStore();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(undefined);
  const selectedMonthYYYYMM = month
    ? dayjs(month).format("YYYY-MM")
    : undefined;

  const periodeText = useMemo(() => {
    if (!selectedMonthYYYYMM) return "Semua Periode";
    const { startDate, endDate } = getPeriodeGaji(selectedMonthYYYYMM);
    return `${dayjs(startDate).format("D MMM")} - ${dayjs(endDate).format("D MMM YYYY")}`;
  }, [selectedMonthYYYYMM]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      // Reset ke halaman 1 saat search berubah
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    isLoading: isLoadingAbsensiGuru,
    isFetching: isFetchingAbsensiGuru,
    refetch: refetchAbsensiGuru,
    pageCount,
    fetchExportData,
    mutations: mutationsAbsenGuru,
  } = useAbsenGuru({
    month: selectedMonthYYYYMM,
    searchFilter: debouncedSearch,
    pagination: pagination,
    filterCabang: activeCabangId,
    onSuccessDelete: () => {
      setDeleteAbsenGuruDialogOpen(false);
      setSelectedAbsenGuruToDelete(null);
    },
    onSuccessUpdateStatus: () => {
      setPendingId(null);
    },
  });

  const { dataComplete: dataGuru, mutations: mutationsGuru } = useUser({
    filterCabang: activeCabangId,
    enableQuery: true,
    // initialDataGuruComplete: initialDataGuru,
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
    mutationsAbsenGuru.verify.mutate(
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

  const handleExport = async () => {
    const toastId = toast.loading("Mengunduh data absensi...");
    try {
      const data = await fetchExportData();

      // Flatten Data untuk CSV
      const csvData = data.map((item) => ({
        "Nama Guru": item.guru.name,
        Kelas: item.sesiPertemuanKelas.kelas.kodeKelas,
        Ruang: item.sesiPertemuanKelas.ruang.namaRuang,
        "Tanggal Waktu": formatToWITA(item.sesiPertemuanKelas.tanggalWaktu),
        "Status Kehadiran": item.status,
        "Status Verifikasi": item.isVerified ? "Terverifikasi" : "Belum",
      }));

      downloadCSV(
        csvData,
        `Laporan-Absensi-Guru-${new Date().toISOString().split("T")[0]}`,
      );
      toast.success("Export berhasil!", { id: toastId });
    } catch (e) {
      toast.error("Gagal mengexport data", { id: toastId });
      console.error(e);
    }
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
        <HeaderActionPortal>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </HeaderActionPortal>

        <div>
          <header className="flex w-full flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  title="Refresh Data"
                  disabled={isLoadingAbsensiGuru || isFetchingAbsensiGuru}
                  onClick={() => refetchAbsensiGuru()}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoadingAbsensiGuru || isFetchingAbsensiGuru ? "animate-spin" : ""}`}
                  />
                </Button>
                <div className="flex flex-col">
                  <h1 className="text-xl">Daftar Absen Guru</h1>
                  <p className="text-muted-foreground text-sm">
                    halaman ini mengatur verifikasi absen guru {periodeText}.
                  </p>
                </div>
              </div>
            </div>

            {/* COMPONENT ADD */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-60">
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  placeholder="Cari nama guru..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                {/* <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      Pilih Bulan Gaji
                    </span> */}
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal md:w-60"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {month
                        ? dayjs(month).format("MMMM YYYY")
                        : "Semua Periode"}{" "}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="end">
                    <Calendar
                      mode="single"
                      month={month}
                      onMonthChange={(newMonth) => {
                        if (newMonth) {
                          setMonth(newMonth);
                          setOpen(false);
                        }
                      }}
                      captionLayout="dropdown"
                      startMonth={new Date(2024, 0)}
                      endMonth={new Date(dayjs().year() + 1, 11)}
                      classNames={{
                        month: "space-y-0 space-x-5 h-8",
                        caption:
                          "relative flex justify-center items-center pt-1",
                        day: "hidden",
                        weekdays: "hidden",
                      }}
                    />
                    <div className="bg-muted/10 border-t p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full text-xs"
                        onClick={() => {
                          setMonth(undefined);
                          setOpen(false);
                          setPagination((prev) => ({
                            ...prev,
                            pageIndex: 0,
                          }));
                        }}
                      >
                        <XCircle className="mr-2 h-3 w-3" />
                        Tampilkan Semua Data
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
          <DataTablePagination
            columns={columnsAbsensiGuru}
            data={dataAbsensiGuru ?? []}
            isLoading={isLoadingAbsensiGuru || isFetchingAbsensiGuru}
            // Tambahkan props pagination ke DataTable
            pagination={pagination}
            onPaginationChange={setPagination}
            pageCount={pageCount}
          />
        </div>
      </TabsContent>

      <TabsContent value="guru">
        <div>
          <header className="flex w-full flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-3">
                <div className="flex flex-col">
                  <h1 className="text-xl">List Guru</h1>
                  <p className="text-muted-foreground text-sm">
                    halaman ini menampilkan daftar guru.
                  </p>
                </div>
              </div>

              <RegistrasiGuru />
            </div>

            {/* FILTER COMPONENT */}
          </header>

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
          <DataTable columns={columnsListGuru} data={dataGuru ?? []} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
