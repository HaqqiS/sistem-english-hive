"use client";

import React from "react";
import Link from "next/link";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";
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
import { AlertCircle, ArrowRight } from "lucide-react";
import { formatToWITA } from "@/utils/dateUtils"; // Pastikan Anda mengimpor ini

export default function RangkumanSesiTab() {
  const {
    dataKelasCount,
    isLoadingKelasCount,
    isErrorKelasCount,
    errorKelasCount,
  } = useSesiPertemuan({
    enableQuery: true,
  });

  if (isLoadingKelasCount) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
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
          dataKelasCount.map((kelas) => (
            <Card className="py-0" key={kelas.id}>
              <CardContent className="p-0">
                <AccordionItem value={kelas.id} className="border-none">
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <div className="flex w-full items-center justify-between">
                      <span className="text-left font-medium">
                        {kelas.kodeKelas}
                      </span>
                      <Badge variant="secondary">
                        {kelas._count.sesiPertemuanKelases} Sesi
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 text-balance">
                    <p className="text-muted-foreground">
                      Sesi pertemuan terakhir pada:{" "}
                      {kelas.sesiPertemuanKelases[0]?.tanggalWaktu
                        ? formatToWITA(
                            kelas.sesiPertemuanKelases[0].tanggalWaktu,
                          )
                        : "Belum ada sesi"}
                    </p>
                    <Button asChild size="sm" className="mt-4">
                      <Link href={`/admin/kelas/sesi/${kelas.id}`}>
                        Lihat Detail Absensi
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground text-center">
            Belum ada kelas yang memiliki sesi pertemuan.
          </p>
        )}
      </Accordion>
    </div>
  );
}
