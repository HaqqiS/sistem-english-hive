"use client";

import { useMemo, useState, useEffect } from "react";
import { Hari } from "@prisma/client";
import { useCabang } from "@/hooks/useCabang";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarDays, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleCard } from "./schedule-card";
import { cn } from "@/lib/utils";
import { DeleteConfirmationDialog } from "@/app/_components/shared/delete-confirmation-dialog";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import dayjs from "dayjs";
import { useIsMobile } from "@/hooks/use-mobile"; // Import hook
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";

export default function ScheduleGrid() {
  // --- STATE ---
  const { activeCabangId } = useGlobalCabangStore();
  // Default hari ini (jika hari minggu/libur, bisa fallback ke SENIN jika mau)
  const [selectedHari, setSelectedHari] = useState<Hari>(
    (dayjs().format("dddd").toUpperCase() as Hari) in Hari
      ? (dayjs().format("dddd").toUpperCase() as Hari)
      : Hari.SENIN,
  );
  const [selectedCabangId, setSelectedCabangId] = useState<string>("");

  // Detect Mobile View
  const isMobile = useIsMobile();

  // State untuk Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    kode: string;
  } | null>(null);

  // --- DATA FETCHING ---
  // const { data: listCabang } = useCabang({ enableQuery: true });
  const {
    dataMatrix,
    isLoadingMatrix: isLoading,
    isErrorMatrix: isError,
    refetchMatrix: refetch,
    isRefetchingMatrix: isRefetching,
    mutations,
  } = useJadwalKelas({
    enableQueryMatrix: true,
    cabangId: activeCabangId,
    hari: selectedHari,
    onSuccessDelete: () => {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
  });

  // Set default cabang
  // useEffect(() => {
  //   if (!selectedCabangId && listCabang && listCabang.length > 0) {
  //     setSelectedCabangId(listCabang[0]!.id);
  //   }
  // }, [listCabang, selectedCabangId]);

  // --- LOGIC MATRIKS ---
  const timeSlots = useMemo(() => {
    if (!dataMatrix?.schedules) return [];
    const times = new Set(dataMatrix.schedules.map((s) => s.jamMulai));
    return Array.from(times).sort();
  }, [dataMatrix]);

  const scheduleMap = useMemo(() => {
    if (!dataMatrix?.schedules) return {};
    const map: Record<
      string,
      Record<string, (typeof dataMatrix.schedules)[0]>
    > = {};
    dataMatrix.schedules.forEach((s) => {
      map[s.jamMulai] ??= {};
      map[s.jamMulai]![s.ruangId] = s;
    });
    return map;
  }, [dataMatrix]);

  // --- HANDLERS ---
  const handleDelete = (id: string, kode: string) => {
    setItemToDelete({ id, kode });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      mutations.delete.mutate({ id: itemToDelete.id });
    }
  };

  // --- RENDER ---
  return (
    <div className="flex h-full flex-col gap-4">
      {/* --- FILTERS --- */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* 2. FILTER CABANG & REFRESH */}
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={isLoading || isRefetching}
            onClick={() => refetch()}
            title="Refresh Jadwal"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (isLoading || isRefetching) && "animate-spin",
              )}
            />
          </Button>

          {/* <Select value={activeCabangId} onValueChange={setSelectedCabangId}>
            <SelectTrigger className="bg-background h-9 w-full lg:w-[200px]">
              <SelectValue placeholder="Pilih Cabang" />
            </SelectTrigger>
            <SelectContent>
              {listCabang?.map((cabang) => (
                <SelectItem key={cabang.id} value={cabang.id}>
                  {cabang.namaCabang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>

        {/* 1. FILTER HARI (Responsive) */}
        {isMobile ? (
          // Tampilan Mobile: Dropdown Select
          <div className="w-full">
            <Select
              value={selectedHari}
              onValueChange={(v) => setSelectedHari(v as Hari)}
            >
              <SelectTrigger className="bg-background w-full">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">
                    <SelectValue />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.values(Hari).map((hari) => (
                  <SelectItem key={hari} value={hari}>
                    {hari}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          // Tampilan Desktop: Tabs
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            <Tabs
              value={selectedHari}
              onValueChange={(v) => setSelectedHari(v as Hari)}
            >
              <TabsList className="bg-muted/50 h-9">
                {Object.values(Hari).map((hari) => (
                  <TabsTrigger
                    key={hari}
                    value={hari}
                    className="data-[state=active]:bg-background px-3 text-xs data-[state=active]:shadow-sm lg:text-sm"
                  >
                    {hari}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* --- MAIN GRID AREA --- */}
      <div className="bg-background relative flex flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
        {isLoading ? (
          <div className="space-y-4 p-8">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 flex-1" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        ) : isError || !dataMatrix ? (
          <Alert variant="destructive" className="m-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Gagal memuat data jadwal.</AlertDescription>
          </Alert>
        ) : dataMatrix.rooms.length === 0 ? (
          <div className="text-muted-foreground bg-muted/5 flex h-[200px] items-center justify-center">
            Belum ada ruangan di cabang ini.
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-muted-foreground bg-muted/5 flex h-[200px] flex-col items-center justify-center gap-2 p-4">
            <Info className="h-10 w-10 opacity-20" />
            <p>
              Belum ada jadwal pada hari{" "}
              <span className="text-foreground font-bold">{selectedHari}</span>{" "}
              di cabang ini.
            </p>
          </div>
        ) : (
          // Area Scroll
          <ScrollArea className="h-full w-full">
            <div className="min-w-max">
              <table className="h-full w-full border-collapse text-sm">
                {/* --- HEADER --- */}
                <thead className="sticky top-0 z-40 shadow-sm">
                  <tr>
                    {/* Corner Header (Jam/Ruang) */}
                    <th className="bg-background text-muted-foreground sticky top-0 left-0 z-50 w-20 border-r border-b p-3 text-center text-xs font-medium">
                      <span className="text-[10px] tracking-wider uppercase">
                        Waktu
                      </span>
                    </th>
                    {/* Room Headers */}
                    {dataMatrix.rooms.map((room) => (
                      <th
                        key={room.id}
                        className="bg-background text-foreground min-w-[250px] border-r border-b p-3 font-semibold"
                      >
                        {room.namaRuang}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* --- BODY --- */}
                <tbody className="bg-background">
                  {timeSlots.map((time, idx) => {
                    // Styling zebra striping untuk baris waktu
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={time}
                        className={cn(
                          "group/row",
                          isEven ? "bg-background" : "bg-muted/5",
                        )}
                      >
                        {/* Sticky Time Column */}
                        <td
                          className={cn(
                            "text-muted-foreground sticky left-0 z-30 border-r border-b p-2 text-center align-top font-mono text-xs font-medium",
                            isEven ? "bg-background" : "bg-background", // Samakan bg agar tidak transparan saat scroll horizontal
                          )}
                        >
                          <div className="sticky top-12 pt-2">{time}</div>
                        </td>

                        {/* Cells */}
                        {dataMatrix.rooms.map((room) => {
                          const schedule = scheduleMap[time]?.[room.id];
                          return (
                            <td
                              key={`${time}-${room.id}`}
                              className="h-32 w-[200px] max-w-[200px] min-w-[200px] border-r border-b p-2 align-top"
                            >
                              {schedule ? (
                                <ScheduleCard
                                  data={schedule}
                                  onDelete={handleDelete}
                                  onEdit={(id) => console.log("Edit", id)}
                                />
                              ) : (
                                // Empty Cell
                                <div className="hover:border-muted-foreground/20 h-full w-full rounded-md border border-dashed border-transparent transition-colors" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Filler Row untuk mengisi ruang kosong di bawah jika ada */}
                  <tr className="h-full">
                    <td className="bg-background sticky left-0 z-30 border-r"></td>
                    {dataMatrix.rooms.map((r) => (
                      <td key={r.id} className="border-r"></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        )}
      </div>

      {/* Delete Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Jadwal"
        description={
          <>
            Yakin ingin menghapus jadwal untuk kelas{" "}
            <span className="text-foreground font-bold">
              {itemToDelete?.kode}
            </span>
            ?
          </>
        }
        onConfirm={handleConfirmDelete}
        isLoading={mutations.delete.isPending}
      />
    </div>
  );
}
