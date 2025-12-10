"use client";

import { useMurid } from "@/hooks/useMurid";
import { useKelas } from "@/hooks/useKelas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import type { TypeClientUpdatePendaftaranKelasSchema } from "@/types/pendaftaranKelas.type";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";

interface EditPendaftaranKelasFormProps {
  onSubmit: (data: TypeClientUpdatePendaftaranKelasSchema) => void;
}

export default function EditPendaftaranKelasForm({
  onSubmit,
}: EditPendaftaranKelasFormProps) {
  const { activeCabangId } = useGlobalCabangStore();
  const form = useFormContext<TypeClientUpdatePendaftaranKelasSchema>();

  const { dataAllMurid } = useMurid({
    filterCabang: activeCabangId,
    enableQuery: true,
  });
  console.log("Data All Murid:", dataAllMurid);
  const { dataKelasAktif: dataKelas } = useKelas({
    filterCabang: activeCabangId,
    enableQueryGetKelasAktif: true,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Murid Selection */}
      <FormField
        control={form.control}
        name="muridId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Murid</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Murid" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Pilih Murid</SelectLabel>
                    {dataAllMurid?.map((murid) => (
                      <SelectItem key={murid.id} value={murid.id}>
                        {murid.namaLengkap}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Kelas Selection */}
      <FormField
        control={form.control}
        name="kelasId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Program Kelas</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Program Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Tipe Program Kelas</SelectLabel>
                    {dataKelas?.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.kodeKelas}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tanggal Mulai */}
      <FormStringDatePicker
        control={form.control}
        name="tanggalMulai"
        label="Tanggal Mulai"
      />

      {/* Status Keaktifan (Specific to Edit) */}
      <FormField
        control={form.control}
        name="isAktif"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status Keaktifan</FormLabel>
            <FormControl>
              <Select
                // Convert string "true"/"false" back to boolean for the form
                onValueChange={(val) => field.onChange(val === "true")}
                value={field.value ? "true" : "false"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  );
}
