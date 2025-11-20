"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { columnsJatuhTempo } from "@/app/_components/views/admin/pembayaran/columns-jatuh-tempo";
import type { TypePembayaranJatuhTempo } from "@/types/pembayaran.type";
import { usePembayaran } from "@/hooks/usePembayaran";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusPembayaran } from "@prisma/client";

export default function DashboardClientPage() {
  // Gunakan hook usePembayaran agar logika mutasi terpusat
  const { dataJatuhTempo, isLoadingJatuhTempo, mutations } = usePembayaran({
    enableGetJatuhTempo: true, // Aktifkan query khusus dashboard
    enableGetAll: false, // Matikan query berat (getAll) di dashboard
  });

  // Handler Verifikasi Cepat
  const handleVerifyClick = (item: TypePembayaranJatuhTempo) => {
    mutations.update.mutate({
      id: item.id,
      jumlahBayar: item.jumlahBayar,
      statusBayar: StatusPembayaran.LUNAS, // Langsung set LUNAS
      tanggalBayar: new Date().toISOString(), // Tanggal hari ini
      note: item.note ?? undefined,
    });
  };

  const tableColumns = columnsJatuhTempo({
    onVerifyClick: handleVerifyClick,
  });

  return (
    <div className="space-y-6">
      <Card className="border-l-accent border-l-4 shadow-sm">
        <CardHeader>
          <CardTitle>Tagihan Jatuh Tempo (14 Hari ke Depan)</CardTitle>
          <CardDescription>
            Daftar siswa yang perlu diingatkan untuk pembayaran periode ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingJatuhTempo ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center">
              Loading data tagihan...
            </div>
          ) : (
            <DataTable data={dataJatuhTempo ?? []} columns={tableColumns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
