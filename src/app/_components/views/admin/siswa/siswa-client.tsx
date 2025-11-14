"use client";

import { DataTable } from "@/app/_components/shared/data-table-generic";
import type { TypeKelas } from "@/types/kelas.type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { TypeMuridNotRegistered } from "@/types/murid.type";
import { useMurid } from "@/hooks/useMurid";
import { columns as columnsMuridNotRegistered } from "./columns-murid-not-registered";

interface ProgramSiswaClientProps {
  initialDataMuridNotRegistered: TypeMuridNotRegistered[];
}

export default function SiswaClient({
  initialDataMuridNotRegistered,
}: ProgramSiswaClientProps) {
  const [deleteKelasDialogOpen, setDeleteKelasDialogOpen] = useState(false);
  const [selectedKelasToDelete, setSelectedKelasToDelete] =
    useState<TypeKelas | null>(null);

  const { dataMuridNotRegistered } = useMurid({
    initialData: initialDataMuridNotRegistered,
  });

  const columnsPendaftaran = columnsMuridNotRegistered({
    onEditClick: (item) => {
      console.log("clicked");
    },
    onDeleteClick: (pendaftaranId) => {
      console.log("deleted");
    },
  });

  return (
    <Tabs defaultValue="daftarMurid">
      <TabsList>
        <TabsTrigger value="daftarMurid">
          Pendaftaran Murid ke Kelas
        </TabsTrigger>
        <TabsTrigger value="listMurid">List Semua Murid</TabsTrigger>
      </TabsList>
      <TabsContent value="daftarMurid">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">
                  Daftar Murid Belum Terdaftar ke Kelas
                </h1>
                <p className="text-muted-foreground text-sm">
                  Halaman ini menampilkan daftar murid yang belum terdaftar ke
                  kelas.
                </p>
              </div>
            </header>
            {/* <TambahPendaftaranKelas /> */}
          </div>

          <DataTable
            columns={columnsPendaftaran}
            data={dataMuridNotRegistered ?? []}
          />
        </div>
      </TabsContent>

      <TabsContent value="listMurid">
        <div>
          <div className="flex items-center justify-between space-x-2 pt-4">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl">Daftar Murid</h1>
                <p className="text-muted-foreground text-sm">
                  Halaman ini menampilkan daftar semua murid.
                </p>
              </div>
            </header>
            {/* <TambahPendaftaranKelas /> */}
          </div>

          {/* <DataTable
            columns={columnsPendaftaran}
            data={dataMuridNotRegistered ?? []}
          /> */}
        </div>
      </TabsContent>
    </Tabs>
  );
}
