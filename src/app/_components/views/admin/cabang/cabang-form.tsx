// src/app/admin/cabang/cabang-form.tsx
"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { TypeClientCabangSchema } from "@/types/cabang.type";
import { useFormContext } from "react-hook-form";

interface CabangFormProps {
  onSubmit: (data: TypeClientCabangSchema) => void;
}

export default function CabangForm({ onSubmit }: CabangFormProps) {
  const form = useFormContext<TypeClientCabangSchema>();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Nama Cabang */}
      <FormField
        control={form.control}
        name="namaCabang"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Cabang</FormLabel>
            <FormControl>
              <Input
                placeholder="Masukkan nama cabang"
                {...field}
                required
                autoFocus
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Alamat */}
      <FormField
        control={form.control}
        name="alamat"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alamat</FormLabel>
            <FormControl>
              <Input placeholder="Masukkan alamat cabang" {...field} required />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* No Telepon */}
      <FormField
        control={form.control}
        name="noTelp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>No Telepon</FormLabel>
            <FormControl>
              <Input
                placeholder="Masukkan no telepon cabang"
                {...field}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  );
}
