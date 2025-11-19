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
import type { TypeClientTambahMuridSchema } from "@/types/pendaftaranKelas.type";
import { useFormContext } from "react-hook-form";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";

interface PendaftaranMuridFormProps {
  onSubmit: (data: TypeClientTambahMuridSchema) => void;
}

export default function PendaftaranMuridForm({
  onSubmit,
}: PendaftaranMuridFormProps) {
  const form = useFormContext<TypeClientTambahMuridSchema>();

  const { dataMuridNotRegistered } = useMurid();

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

      <FormStringDatePicker
        control={form.control}
        name="tanggalMulai"
        label="Tanggal Mulai"
      />
    </form>
  );
}
