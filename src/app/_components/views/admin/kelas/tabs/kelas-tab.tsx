"use client";

import React from "react";
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
  DollarSign,
  GraduationCap,
  User,
} from "lucide-react";
import { formatToWITA } from "@/utils/dateUtils"; // Pastikan Anda mengimpor ini
import { useKelas } from "@/hooks/useKelas";
import { toRupiah } from "@/utils/toRupiah";

export default function KelasTab() {
  const {
    dataKelasCount,
    isLoadingKelasCount,
    isErrorKelasCount,
    errorKelasCount,
  } = useKelas({
    enableQueryGetKelasCount: true,
  });

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
    <div className="pt-4">
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
                            </Link>
                          </Button>

                          <Button
                            asChild
                            size="sm"
                            className="w-full shadow-sm sm:w-auto"
                          >
                            <Link href={`/admin/kelas/detail/${kelas.id}`}>
                              Detail Kelas
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>

                    {/* <AccordionContent className="bg-muted/10 border-t px-6 py-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-foreground text-sm font-medium">
                            Pertemuan Terakhir
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Sesi terakhir:{" "}
                            {lastSession ? (
                              <span className="text-foreground font-medium">
                                {formatToWITA(lastSession)}
                              </span>
                            ) : (
                              <span className="italic">Belum ada sesi</span>
                            )}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/admin/kelas/sesi/${kelas.id}`}>
                              Lihat Absensi
                            </Link>
                          </Button>

                          <Button asChild size="sm">
                            <Link href={`/admin/kelas/detail/${kelas.id}`}>
                              Detail Kelas
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent> */}
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
    </div>
  );
}
