"use client";

import { useMurid } from "@/hooks/useMurid";
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
import type { TypeClientPendaftaranKelasSchema } from "@/types/pendaftaranKelas.type";
import { useFormContext } from "react-hook-form";
import { useKelas } from "@/hooks/useKelas";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";

interface PendaftaranKelasFormProps {
  onSubmit: (data: TypeClientPendaftaranKelasSchema) => void;
}

export default function PendaftaranKelasForm({
  onSubmit,
}: PendaftaranKelasFormProps) {
  const form = useFormContext<TypeClientPendaftaranKelasSchema>();

  const { dataMuridNotRegistered } = useMurid();
  const { data: dataKelas } = useKelas();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="muridId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Murid</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Murid" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Pilih Murid</SelectLabel>
                    {dataMuridNotRegistered?.map((murid) => (
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

      <FormField
        control={form.control}
        name="kelasId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Program Kelas</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Program Kelas" />
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

      <FormStringDatePicker
        control={form.control}
        name="tanggalMulai"
        label="Tanggal Mulai"
      />

      {/* <FormField
        control={form.control}
        name="isAktif"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pilih Status</FormLabel>
            <FormControl>
              <Select
                // 'z.coerce.boolean()' akan menangani "true"/"false"
                onValueChange={(val) => field.onChange(val)}
                // Ambil nilai default dari skema (true)
                value={field.value ? "true" : "false"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      /> */}
    </form>
  );
}
