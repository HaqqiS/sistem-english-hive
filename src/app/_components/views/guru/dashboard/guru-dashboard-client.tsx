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
import { useAbsenGuru } from "@/hooks/useAbsenGuru";

export default function GuruDashboardClient() {
  const router = useRouter();

  // --- State untuk Dialog Ganti Ruang ---
  const [isGantiRuangOpen, setIsGantiRuangOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] =
    useState<TypeJadwalHariIniItem | null>(null);
  const [overrideRuangId, setOverrideRuangId] = useState<string | undefined>(
    undefined,
  );

  // --- Hooks & Mutations ---
  // Menggunakan custom hook yang sudah direfactor
  const { mutations } = useAbsenGuru({
    onSuccessStartSesi: (newSesiId) => {
      setIsGantiRuangOpen(false);
      // Redirect ke halaman absensi
      router.push(`/guru/absen/${newSesiId}`);
    },
  });

  // Ambil mutation object
  const {
    mutate: mulaiSesi,
    isPending: isStartingSesi,
    variables: startingVars,
  } = mutations.startSesi;

  // --- Data Queries ---
  const {
    data: jadwalHariIni,
    isLoading,
    isError,
    error,
  } = api.jadwalKelas.getJadwalHariIniForGuru.useQuery();

  const { data: semuaRuangan, isLoading: isLoadingRuangan } =
    api.ruang.getAll.useQuery();

  // --- Handlers ---
  const handleMulaiSesi = (
    jadwal: TypeJadwalHariIniItem,
    ruangId: string | undefined,
  ) => {
    if (isStartingSesi) return;

    mulaiSesi({
      jadwalKelasId: jadwal.jadwalId,
      status: StatusAbsenGuru.HADIR,
      overrideRuangId: ruangId,
    });
  };

  const openGantiRuangDialog = (jadwal: TypeJadwalHariIniItem) => {
    setSelectedJadwal(jadwal);
    setOverrideRuangId(jadwal.ruangId);
    setIsGantiRuangOpen(true);
  };

  const handleGantiRuangSubmit = () => {
    if (selectedJadwal) {
      handleMulaiSesi(selectedJadwal, overrideRuangId);
    }
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
      <Alert
        variant="default"
        className="bg-muted/50 border-muted-foreground/20"
      >
        <CheckCircle2 className="h-4 w-4 text-green-600" />
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
          const isThisItemLoading =
            isStartingSesi && startingVars?.jadwalKelasId === jadwal.jadwalId;

          return (
            <Card
              key={jadwal.jadwalId}
              className={isThisItemLoading ? "border-primary/50 shadow-md" : ""}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span>{`${jadwal.jamMulai} - ${jadwal.jamSelesai}`}</span>
                </CardTitle>
                <CardDescription className="text-primary font-medium">
                  {jadwal.kodeKelas}
                </CardDescription>
                {jadwal.guru && (
                  <p className="text-muted-foreground text-sm">
                    Pengajar:{" "}
                    <span className="text-foreground font-medium">
                      {jadwal.guru.name}
                    </span>
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <p className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Ruang:</span>
                  <span className="font-medium">{jadwal.namaRuang}</span>
                </p>
              </CardContent>
              <CardFooter className="flex items-center gap-2 pt-0">
                {sudahDimulai ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(`/guru/absen/${jadwal.sesiIdSudahDibuat}`)
                    }
                    disabled={isStartingSesi}
                  >
                    <Play className="mr-2 h-4 w-4 text-green-500" />
                    Lanjutkan Sesi
                  </Button>
                ) : (
                  <div className="flex w-full items-center gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleMulaiSesi(jadwal, undefined)}
                      disabled={isStartingSesi} // Disable semua tombol agar tidak spam klik
                    >
                      {isThisItemLoading ? (
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
                          className="shrink-0"
                          disabled={isStartingSesi}
                        >
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openGantiRuangDialog(jadwal)}
                        >
                          <Replace className="mr-2 h-4 w-4" />
                          Ganti Ruang & Mulai
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
