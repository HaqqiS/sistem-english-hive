"use client";

import type { TypeKelasByGuruId } from "@/types/kelas.type";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useKelas } from "@/hooks/useKelas";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatToWITA } from "@/utils/dateUtils";
import { CalendarDays, ChevronRight, Clock, School, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AbsenMuridClient() {
  const { dataWithSesi: dataKelas, isLoadingWithSesi } = useKelas({
    // initialDataKelasWithSesi: initialData,
  });

  if (isLoadingWithSesi) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Empty State
  if (!dataKelas || dataKelas.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <School className="text-muted-foreground h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">Belum ada Kelas</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Anda belum memiliki kelas yang aktif atau belum ada sesi pertemuan
            yang dijadwalkan.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full space-y-4">
        {dataKelas.map((kelas) => {
          const totalSesi = kelas.sesiPertemuanKelases.length;

          return (
            <Card
              className="overflow-hidden py-0 transition-all hover:shadow-sm"
              key={kelas.id}
            >
              <CardContent className="p-0">
                <AccordionItem
                  value={`item-${kelas.id}`}
                  className="border-none"
                >
                  <AccordionTrigger className="hover:bg-muted/50 items-center px-6 py-4 transition-colors hover:no-underline">
                    <div className="flex flex-1 items-center justify-between pr-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-semibold">
                            {kelas.kodeKelas}
                          </p>
                          {/* <p className="text-muted-foreground hidden text-xs sm:block">
                            ID: {kelas.id.slice(-6)}
                          </p> */}
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-auto sm:ml-0">
                        {totalSesi} Sesi
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-0">
                    <div className="bg-muted/10 flex flex-col border-t">
                      {kelas.sesiPertemuanKelases.map((sesi, sesiIndex) => {
                        // Hitung pertemuan ke berapa (karena sort desc, index 0 adalah pertemuan terakhir)
                        const pertemuanKe = totalSesi - sesiIndex;

                        return (
                          <React.Fragment key={sesi.id}>
                            <Link
                              href={`/guru/absen/${sesi.id}`}
                              className="group hover:bg-muted/50 block transition-all"
                            >
                              <div className="flex w-full items-center justify-between px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-primary flex items-center gap-2 text-sm font-medium">
                                    Pertemuan {pertemuanKe}
                                  </span>
                                  <div className="text-muted-foreground flex items-center gap-3 text-xs sm:text-sm">
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="h-3.5 w-3.5" />
                                      {formatToWITA(
                                        sesi.tanggalWaktu,
                                        "dddd, D MMMM YYYY",
                                      )}
                                    </span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" />
                                      {formatToWITA(
                                        sesi.tanggalWaktu,
                                        "HH:mm",
                                      )}{" "}
                                      WITA
                                    </span>
                                  </div>
                                </div>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 opacity-50 transition-opacity group-hover:opacity-100"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </Link>
                            {/* Separator antar item, kecuali item terakhir */}
                            {sesiIndex < totalSesi - 1 && (
                              <Separator className="mx-6 w-auto opacity-50" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </CardContent>
            </Card>
          );
        })}
      </Accordion>
    </div>
  );
}
