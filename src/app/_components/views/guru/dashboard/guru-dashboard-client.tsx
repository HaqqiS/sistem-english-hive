"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Ellipsis,
  Loader2,
  Play,
  Replace,
} from "lucide-react";
import { StatusAbsenGuru } from "@prisma/client";
import type { TypeJadwalHariIniItem } from "@/types/jadwalKelas.type";
import { toast } from "sonner";

export default function GuruDashboardClient() {
  const router = useRouter();

  // --- State untuk Dialog Ganti Ruang ---
  const [isGantiRuangOpen, setIsGantiRuangOpen] = useState(false);
  // Menyimpan jadwal yang sedang dipilih untuk diganti ruang
  const [selectedJadwal, setSelectedJadwal] =
    useState<TypeJadwalHariIniItem | null>(null);
  // Menyimpan ID ruang yang dipilih di dialog
  const [overrideRuangId, setOverrideRuangId] = useState<string | undefined>(
    undefined,
  );

  // --- Data Queries ---
  // 1. Ambil jadwal hari ini (sudah di-prefetch di server)
  const {
    data: jadwalHariIni,
    isLoading,
    isError,
    error,
  } = api.jadwalKelas.getJadwalHariIniForGuru.useQuery();

  console.table(jadwalHariIni);

  // 2. Ambil semua data ruang (untuk <Select> di dialog)
  const { data: semuaRuangan, isLoading: isLoadingRuangan } =
    api.ruang.getAll.useQuery();

  // --- Mutation ---
  // 3. Ambil mutasi createSesiAndAbsensi
  const { mutate: mulaiSesi, isPending: isStartingSesi } =
    api.absenGuru.createSesiAndAbsensi.useMutation({
      onSuccess: (data) => {
        // 'data.newSesiId' adalah ID dari SesiPertemuanKelas yang baru
        toast.success("Sesi berhasil dimulai!");
        // Arahkan guru ke halaman absensi murid
        router.push(`/guru/absen/${data.newSesiId}`);
      },
      onError: (err) => {
        toast.error(`Gagal memulai sesi: ${err.message}`);
      },
    });

  // --- Handlers ---
  /**
   * Dipanggil baik oleh tombol "Mulai Sesi" atau "Mulai Sesi di Ruang Baru"
   */
  const handleMulaiSesi = (
    jadwal: TypeJadwalHariIniItem,
    ruangId: string | undefined, // undefined jika pakai ruang default
  ) => {
    // Pastikan sesi tidak sedang diproses
    if (isStartingSesi) return;

    mulaiSesi({
      jadwalKelasId: jadwal.jadwalId,
      status: StatusAbsenGuru.HADIR, // Asumsi guru selalu HADIR saat memulai
      overrideRuangId: ruangId,
    });
  };

  /**
   * Dipanggil saat mengklik "Ganti Ruang" dari DropdownMenu
   */
  const openGantiRuangDialog = (jadwal: TypeJadwalHariIniItem) => {
    setSelectedJadwal(jadwal);
    setOverrideRuangId(jadwal.ruangId); // Set default value ke ruang asli
    setIsGantiRuangOpen(true);
  };

  /**
   * Dipanggil saat tombol "Mulai Sesi" di dalam dialog diklik
   */
  const handleGantiRuangSubmit = () => {
    if (selectedJadwal) {
      handleMulaiSesi(selectedJadwal, overrideRuangId);
    }
    setIsGantiRuangOpen(false); // Tutup dialog
  };

  // --- Render States ---
  if (isLoading || isLoadingRuangan) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Gagal Memuat Jadwal</AlertTitle>
        <AlertDescription>{error?.message}</AlertDescription>
      </Alert>
    );
  }

  if (!jadwalHariIni || jadwalHariIni.length === 0) {
    return (
      <Alert variant="destructive">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Jadwal Kosong</AlertTitle>
        <AlertDescription>
          Anda tidak memiliki jadwal mengajar hari ini. Selamat beristirahat!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jadwalHariIni.map((jadwal) => {
          // Cek apakah sesi untuk jadwal ini sudah dibuat
          const sudahDimulai = !!jadwal.sesiIdSudahDibuat;

          return (
            <Card key={jadwal.jadwalId}>
              <CardHeader>
                <CardTitle>
                  {`${jadwal.jamMulai} - ${jadwal.jamSelesai}`}
                  {jadwal.guru ? ` - ${jadwal.guru.name}` : ""}
                </CardTitle>
                <CardDescription>{jadwal.kodeKelas}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Ruang:{" "}
                  <span className="text-foreground font-medium">
                    {jadwal.namaRuang}
                  </span>
                </p>
              </CardContent>
              <CardFooter className="flex items-center gap-2">
                {sudahDimulai ? (
                  // --- KASUS 1: SESI SUDAH DIMULAI ---
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(`/guru/absen/${jadwal.sesiIdSudahDibuat}`)
                    }
                  >
                    <Play className="mr-2 h-4 w-4 text-green-500" />
                    Lanjutkan Sesi
                  </Button>
                ) : (
                  // --- KASUS 2: SESI BELUM DIMULAI ---
                  <div className="flex w-full items-center justify-between">
                    <Button
                      className="flex-1"
                      onClick={() => handleMulaiSesi(jadwal, undefined)}
                      disabled={isStartingSesi}
                    >
                      {isStartingSesi ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Mulai Sesi
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 shrink-0"
                          disabled={isStartingSesi}
                        >
                          <Ellipsis />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openGantiRuangDialog(jadwal)}
                        >
                          <Replace className="mr-2 h-4 w-4" />
                          Ganti Ruang
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* --- Dialog untuk Ganti Ruang --- */}
      <Dialog open={isGantiRuangOpen} onOpenChange={setIsGantiRuangOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Ruang Sesi</DialogTitle>
            <DialogDescription>
              Pilih ruang baru untuk sesi{" "}
              <span className="font-bold">{selectedJadwal?.kodeKelas}</span>{" "}
              pada jam {selectedJadwal?.jamMulai}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ruang-select" className="text-right">
                Ruang Baru
              </Label>
              <div className="col-span-3">
                <Select
                  value={overrideRuangId}
                  onValueChange={setOverrideRuangId}
                >
                  <SelectTrigger id="ruang-select">
                    <SelectValue placeholder="Pilih ruang baru..." />
                  </SelectTrigger>
                  <SelectContent>
                    {semuaRuangan?.map((ruang) => (
                      <SelectItem key={ruang.id} value={ruang.id}>
                        {ruang.namaRuang} (Cabang: {ruang.cabang.namaCabang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleGantiRuangSubmit}
              disabled={!overrideRuangId || isStartingSesi}
            >
              {isStartingSesi ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Mulai Sesi di Ruang Baru
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
