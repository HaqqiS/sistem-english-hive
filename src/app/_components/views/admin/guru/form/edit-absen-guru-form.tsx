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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { type TypeUpdateAbsensiGuruSchema } from "@/types/absenGuru.type";
import { useFormContext } from "react-hook-form";
import { StatusAbsenGuru } from "@prisma/client";

interface AbsenGuruFormProps {
  onSubmit: (data: TypeUpdateAbsensiGuruSchema) => void;
}

export default function AbsenGuruForm({ onSubmit }: AbsenGuruFormProps) {
  const form = useFormContext<TypeUpdateAbsensiGuruSchema>();
  const { data: dataUser, isLoading } = useUser();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="guruId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Guru</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={isLoading ? "Loading..." : "Pilih Guru"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {dataUser?.map((guru) => (
                    <SelectItem key={guru.id} value={guru.id}>
                      {guru.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="isVerified"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilih Status Verifikasi</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(val) => field.onChange(val === "true")}
                  value={field.value ? "true" : "false"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Terverifikasi</SelectItem>
                    <SelectItem value="false">Tidak Terverifikasi</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilih Status Absen</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString()}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Status Absen" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(StatusAbsenGuru).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
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
