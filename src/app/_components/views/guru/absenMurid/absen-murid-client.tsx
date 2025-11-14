"use client";

import { DataTable } from "@/app/_components/shared/data-table";
import { columns } from "./columns-jadwal-sesi";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";
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
import { CalendarDays, ChevronRight } from "lucide-react";

interface AbsenClientProps {
  initialData: TypeKelasByGuruId[];
}

export default function AbsenMuridClient({ initialData }: AbsenClientProps) {
  console.table(initialData);

  const { dataWithSesi: dataKelas, isLoadingWithSesi } = useKelas({
    initialDataKelasWithSesi: initialData,
  });

  const columnsSesiPertemuan = columns({
    onEditClick: (item) => {
      console.log(item);
    },
    onDeleteClick: (id) => {
      console.log(id);
    },
  });
  // const columnsAbsensiGuru = columns({
  //   onEditClick: (item) => {
  //     console.log(item);
  //   },
  //   onDeleteClick: (id) => {
  //     console.log(id);
  //   },
  //   onStatusChange: (item, status) => {
  //     console.log(item, status);
  //     mutations.updateStatus.mutate({
  //       absensiId: item.id,
  //       isVerified: status,
  //     });
  //   },
  //   isPendingStatusChange: mutations.updateStatus.isPending,
  // });
  return (
    <div>
      <div className="flex space-x-2">{/* <TambahJadwalSesi /> */}</div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {dataKelas?.map((kelas, index) => (
          <Card className="py-0" key={kelas.id}>
            <CardContent className="p-0">
              <AccordionItem value={`item-${index}`} className="border-none">
                <AccordionTrigger className="p-6 hover:no-underline">
                  {kelas.kodeKelas}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-0 text-balance">
                  {kelas.sesiPertemuanKelases.map((sesi, sesiIndex) => (
                    <React.Fragment key={sesi.id}>
                      {/* Jadikan setiap sesi sebagai Link */}
                      <Link href={`/guru/absen/${sesi.id}`}>
                        <Button
                          variant="ghost"
                          className="flex w-full justify-between rounded-none px-6 py-6"
                        >
                          <div className="flex items-center gap-2">
                            <CalendarDays className="text-muted-foreground h-4 w-4" />
                            <span>
                              Pertemuan{" "}
                              {kelas.sesiPertemuanKelases.length - sesiIndex}:{" "}
                              {formatToWITA(
                                sesi.tanggalWaktu,
                                "dddd, D MMMM YYYY, HH:mm",
                              )}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      {/* Tampilkan separator jika bukan item terakhir */}
                      {sesiIndex < kelas.sesiPertemuanKelases.length - 1 && (
                        <Separator />
                      )}
                    </React.Fragment>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </CardContent>
          </Card>
        ))}
      </Accordion>

      {/* <DataTable
        filterColumnId="isVerified"
        filterColumnPlaceholder="Filter Status..."
        columns={columnsSesiPertemuan}
        data={initialData ?? []}
        toolbar={(table) => <div className="flex items-center gap-2"></div>}
      /> */}
    </div>
  );
}
