"use client";

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
import type { TypeClientHistoryGuruKelasSchema } from "@/types/historyGuruKelas.type";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import { useUser } from "@/hooks/useUser";

interface GuruKelasFormProps {
  // onSubmit: (data: TypeClientHistoryGuruKelasSchema) => void;
  isDisabled?: boolean;
}

export default function GuruKelasForm({
  // onSubmit,
  isDisabled,
}: GuruKelasFormProps) {
  const form = useFormContext<TypeClientHistoryGuruKelasSchema>();

  const { data: dataGuru, isLoading: isLoadingGuru } = useUser();

  return (
    // <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="guruId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guru</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Guru" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Pilih Guru Kelas</SelectLabel>
                      {isLoadingGuru && (
                        <SelectItem value="loading">Loading...</SelectItem>
                      )}
                      {dataGuru?.map((guru) => (
                        <SelectItem key={guru.id} value={guru.id}>
                          {guru.name}
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
          name="mulaiPada"
          label="Tanggal Mulai"
          disabled={isDisabled}
        />
      </div>
    </div>
  );
}
