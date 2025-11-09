"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import { useKelas } from "@/hooks/useKelas";
import { useParams } from "next/navigation";
import { columns as murid } from "./columns-list-murid";
import { columns as guru } from "./columns-list-guru";
import TambahMuridDetailKelas from "./tambah-murid";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";
import TambahGuruKelas from "./tambah-guru";
import EditGuruKelas from "../drawers/edit-guru-kelas";
import { useGuruKelasStore } from "@/store/useKelasStore";

export default function DetailKelasClient() {
  const { kelasId } = useParams<{ kelasId: string }>();
  const { dataById } = useKelas({ kelasId });

  const { dataByKelasId } = usePendaftaranKelas({
    enableQuery: !!kelasId,
    kelasId,
  });

  const { dataById: dataGuruByKelasId, isLoadingById: loadingGuru } =
    UseHistoryGuruKelas({
      kelasId,
      enableQuery: !!kelasId,
    });
  console.log("History Guru Kelas Data:", dataGuruByKelasId);

  const columnsMurid = murid({
    onEditClick: (item) => {
      console.log("Edit clicked for:", item);
    },
    onDeleteClick: (pendaftaranId, namaLengkap) => {
      console.log(
        `Delete clicked for ID: ${pendaftaranId}, Name: ${namaLengkap}`,
      );
    },
  });

  const columnsGuru = guru({
    onEditClick: (item) => {
      console.log("Edit clicked for:", item);
    },
    onDeleteClick: (id) => {
      console.log(`Delete clicked for ID: ${id}, Name: `);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between space-x-2 pt-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl">
              List Murid Dari kelas {dataById?.kodeKelas}
            </h1>
            <p className="text-muted-foreground text-sm">
              This is the kelas management page.
            </p>
          </div>
        </header>
        <TambahMuridDetailKelas kelasId={kelasId} />
      </div>

      <DataTable data={dataByKelasId ?? []} columns={columnsMurid} />

      <div className="flex items-center justify-between space-x-2 pt-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl">
              History Guru Kelas {dataById?.kodeKelas}
            </h1>
            <p className="text-muted-foreground text-sm">
              This is the kelas management page.
            </p>
          </div>
        </header>

        {!loadingGuru && Array.isArray(dataGuruByKelasId) ? (
          // <TambahGuruKelas kelasId={kelasId} />
          <EditGuruKelas />
        ) : (
          <>edit</>
        )}
      </div>

      <DataTable data={dataGuruByKelasId ?? []} columns={columnsGuru} />
    </div>
  );
}
