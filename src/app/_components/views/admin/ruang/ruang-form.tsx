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
import { useCabang } from "@/hooks/useCabang";
import { UserRole } from "@/server/auth/type";
import type { TypeClientRuangSchema } from "@/types/ruang.type";
import { useSession } from "next-auth/react";
import { useFormContext } from "react-hook-form";

interface RuangFormProps {
  onSubmit: (data: TypeClientRuangSchema) => void;
}

export default function RuangForm({ onSubmit }: RuangFormProps) {
  const session = useSession();
  const isAdmin = session.data?.user.role === UserRole.ADMIN;
  const form = useFormContext<TypeClientRuangSchema>();
  const { data: dataCabang, isLoading } = useCabang();

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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="isAktif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilih Status</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString()}
                >
                  <SelectTrigger className="w-full">
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

        {!isAdmin && (
          <FormField
            control={form.control}
            name="cabangId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Cabang</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={isLoading ? "Loading..." : "Pilih Cabang"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {dataCabang?.map((items) => (
                        <SelectItem key={items.id} value={items.id}>
                          {items.namaCabang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </form>
  );
}
