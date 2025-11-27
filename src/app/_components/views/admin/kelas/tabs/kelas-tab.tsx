"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Edit2,
  EllipsisVertical,
  GraduationCap,
  Trash,
  TrendingUp,
  User,
} from "lucide-react";
import TambahProgramKelas from "../drawers/tambah-kelas";
import EditKelas from "../drawers/edit-kelas";
import EditGuruKelas from "../drawers/edit-guru-kelas";
import UpLevelKelas from "../drawers/up-level-kelas";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { toast } from "sonner";
import { formatToWITA } from "@/utils/dateUtils";
import { useKelas } from "@/hooks/useKelas";
import { toRupiah } from "@/utils/toRupiah";
import type { TypeKelasWithSesiPertemuanCount } from "@/types/kelas.type";
import { useGuruKelasStore, useKelasStore } from "@/store/useKelasStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function KelasTab() {
  // 1. State Lokal untuk Delete Dialog
  const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
  const [selectedKelasToDelete, setSelectedKelasToDelete] =
    useState<TypeKelasWithSesiPertemuanCount | null>(null);

  // 2. Zustand Store Actions
  const { openDrawer: openKelasDrawer } = useKelasStore();
  const { openDrawer: openGuruKelasDrawer } = useGuruKelasStore();

  const {
    dataKelasCount,
    isLoadingKelasCount,
    isErrorKelasCount,
    errorKelasCount,
    mutations: kelasMutations,
  } = useKelas({
    enableQueryGetAll: false,
    enableQueryGetKelasCount: true,
    onSuccessDelete: () => {
      setDeleteKelasDialogOpen(false);
      setSelectedKelasToDelete(null);
    },
  });

  // 4. Handlers
  const handleEditClickKelas = (item: TypeKelasWithSesiPertemuanCount) => {
    // Perlu casting karena TypeKelasWithSesiPertemuanCount strukturnya mirip TypeKelas
    // tapi ada tambahan _count. Untuk form edit, data dasar sudah cukup.
    openKelasDrawer("edit", item);
  };

  const handleEditClickGuruKelas = (item: TypeKelasWithSesiPertemuanCount) => {
    const history = item.historyGuruKelases?.[0];
    if (history) {
      // @ts-expect-error: types compatible
      openGuruKelasDrawer("edit", history);
    } else {
      toast.error("Tidak ada data guru aktif untuk diedit.");
    }
  };

  const handleUpLevelClick = (item: TypeKelasWithSesiPertemuanCount) => {
    openKelasDrawer("upLevel", item);
  };

  const handleDeleteClick = (item: TypeKelasWithSesiPertemuanCount) => {
    setSelectedKelasToDelete(item);
    setDeleteKelasDialogOpen(true);
  };

  const handleConfirmDeleteKelas = async () => {
    if (!selectedKelasToDelete) return;
    await kelasMutations.delete.mutateAsync({ id: selectedKelasToDelete.id });
  };

  if (isLoadingKelasCount) {
    return (
      <div className="space-y-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isErrorKelasCount) {
    return (
      <Card className="border-destructive bg-destructive/10 mt-4">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <AlertCircle className="text-destructive h-6 w-6" />
          <CardTitle className="text-destructive">Gagal Memuat Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive/80 text-sm">
            {errorKelasCount?.message ?? "Terjadi kesalahan tidak diketahui."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2 pt-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl">Daftar Kelas</h1>
            <p className="text-muted-foreground text-sm">
              {dataKelasCount?.length} kelas terdaftar
            </p>
          </div>
        </header>

        <TambahProgramKelas />
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {dataKelasCount && dataKelasCount.length > 0 ? (
          dataKelasCount.map((kelas) => {
            const guruAktif =
              kelas.historyGuruKelases[0]?.guru.name ?? "Belum ada guru";
            const lastSession = kelas.sesiPertemuanKelases[0]?.tanggalWaktu;
            const jadwalHari =
              kelas.jadwalKelas.length > 0
                ? kelas.jadwalKelas.map((j) => j.hari).join(", ")
                : "Jadwal belum diatur";

            return (
              <Card className="py-0" key={kelas.id}>
                <CardContent className="p-0">
                  <AccordionItem value={kelas.id} className="border-none">
                    <AccordionTrigger className="hover:bg-muted/30 items-center px-6 py-5 transition-colors hover:no-underline">
                      <div className="flex w-full flex-col items-start justify-between gap-4 pr-4 md:flex-row md:items-center">
                        {/* Bagian Kiri: Identitas Kelas */}
                        <div className="flex flex-col items-start gap-1.5 text-left">
                          <span className="text-foreground text-lg font-bold tracking-tight">
                            {kelas.kodeKelas}
                          </span>

                          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                            {/* Guru */}
                            <div className="bg-muted/50 flex items-center gap-1.5 rounded-md px-2.5 py-1">
                              <User className="text-primary h-3.5 w-3.5" />
                              <span className="font-medium">{guruAktif}</span>
                            </div>
                            {/* Jadwal Hari */}
                            <div className="bg-muted/50 flex items-center gap-1.5 rounded-md px-2.5 py-1">
                              <CalendarDays className="text-primary h-3.5 w-3.5" />
                              <span>{jadwalHari}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bagian Kanan: Badge Statistik */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0">
                          <Badge
                            variant="secondary"
                            className="flex gap-1.5 px-3 py-1"
                          >
                            <GraduationCap className="h-3.5 w-3.5" />
                            <span>{kelas._count.pendaftaranKelases} Murid</span>
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary flex gap-1.5 px-3 py-1"
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>
                              {kelas._count.sesiPertemuanKelases} Sesi
                            </span>
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="bg-muted/5 border-t px-6 py-5">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Info Harga */}
                        <div className="space-y-1.5">
                          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            Harga Kelas
                          </p>
                          <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                            {toRupiah(kelas.hargaKelas)}
                            <span className="text-muted-foreground text-xs font-normal">
                              / Sesi
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            Sesi Pertemuan Terakhir
                          </p>
                          <p className="text-sm">
                            {lastSession ? (
                              <span className="text-foreground font-medium">
                                {formatToWITA(lastSession)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Belum ada sesi
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex flex-col items-end gap-3 sm:flex-row md:col-span-1 md:items-center md:justify-end">
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="w-full sm:w-auto"
                          >
                            <Link href={`/admin/sesi/${kelas.id}`}>
                              Riwayat Absensi
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>

                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="w-full shadow-sm sm:w-auto"
                          >
                            <Link href={`/admin/kelas/detail/${kelas.id}`}>
                              Detail Kelas
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
                                size="icon"
                              >
                                <EllipsisVertical />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem
                                onClick={() => handleEditClickKelas(kelas)}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit Kelas
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClickGuruKelas(kelas)}
                              >
                                <User className="mr-2 h-4 w-4" />
                                Edit Guru
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleUpLevelClick(kelas)}
                              >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Naik Kelas (Up Level)
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDeleteClick(kelas)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-muted-foreground text-center">
            Belum ada kelas yang memiliki sesi pertemuan.
          </p>
        )}
      </Accordion>

      <EditKelas />
      <EditGuruKelas />
      <UpLevelKelas />
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
  );
}
