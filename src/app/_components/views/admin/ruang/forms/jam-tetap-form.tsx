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
import type { TypeClientJamTetapSchema } from "@/types/jam.type";
import { useSession } from "next-auth/react";
import { useFormContext } from "react-hook-form";

interface JamFormProps {
  onSubmit: (data: TypeClientJamTetapSchema) => void;
}

export default function JamForm({ onSubmit }: JamFormProps) {
  const session = useSession();
  const isAdmin = session.data?.user?.role === UserRole.ADMIN;

  const form = useFormContext<TypeClientJamTetapSchema>();
  const { data: dataCabang, isLoading } = useCabang();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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


      <FormField
        control={form.control}
        name="namaSlot"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Slot</FormLabel>
            <FormControl>
              <Input
                placeholder="Contoh: Sesi 1"
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
          name="jamMulai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Mulai</FormLabel>
              <FormControl>
                <Input type="time" placeholder="14:30" {...field} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jamSelesai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Selesai</FormLabel>
              <FormControl>
                <Input type="time" placeholder="17:00" {...field} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </form>
  );
}
