"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TypeClientRuangSchema } from "@/types/ruang.type";
import { useFormContext } from "react-hook-form";
import useCabangController from "../useCabangController";

interface RuangFormProps {
  onSubmit: (data: TypeClientRuangSchema) => void;
}

export default function RuangForm({ onSubmit }: RuangFormProps) {
  const form = useFormContext<TypeClientRuangSchema>();
  const { dataCabang } = useCabangController();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="namaRuang"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Ruang</FormLabel>
            <FormControl>
              <Input
                placeholder="Masukkan nama ruang"
                {...field}
                required
                autoFocus
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="kodeRuang"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kode Ruang</FormLabel>
            <FormControl>
              <Input placeholder="Masukkan kode ruang" {...field} required />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="isAktif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilih Status</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(val) => field.onChange(val === "true")}
                  value={field.value === true ? "true" : "false"}
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
        />

        <FormField
          control={form.control}
          name="cabangId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Cabang</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataCabang?.map((items) => {
                      return (
                        <SelectItem key={items.id} value={items.id}>
                          {items.namaCabang}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </form>
  );
}
