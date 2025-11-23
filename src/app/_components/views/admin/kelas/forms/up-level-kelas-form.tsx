"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { IMaskInput } from "react-imask";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import type { TypeUpLevelKelasSchema, TypeKelas } from "@/types/kelas.type";

interface UpLevelKelasFormProps {
  onSubmit: (data: TypeUpLevelKelasSchema) => void;
  oldKelasData: TypeKelas | null;
}

const safeVal = (val: string | number | null | undefined) => val ?? "";

export default function UpLevelKelasForm({
  onSubmit,
  oldKelasData,
}: UpLevelKelasFormProps) {
  const form = useFormContext<TypeUpLevelKelasSchema>();
  const { watch, setValue } = form;

  // Watch fields affecting code generation
  const newLevel = watch("newLevel");
  const newBulanTahunAjar = watch("newBulanTahunAjar");

  // Effect to auto-generate new Kode Kelas
  useEffect(() => {
    if (!oldKelasData) return;

    const { jenisKelas, grup, tipe } = oldKelasData;

    // Generate Kode Kelas Baru only if inputs are sufficient
    // Format: "Jenis Level-Grup | Tipe | BulanTahun"
    // e.g., "TinyTods 2-A | REGULAR | 03/2026"
    if (newLevel && newBulanTahunAjar && newBulanTahunAjar.length >= 7) {
      const generatedCode = `${jenisKelas} ${safeVal(newLevel)}-${safeVal(grup)} | ${safeVal(tipe)} | ${safeVal(newBulanTahunAjar)}`;

      setValue("newKodeKelas", generatedCode, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [newLevel, newBulanTahunAjar, oldKelasData, setValue]);

  if (!oldKelasData) {
    return <div>Loading data kelas lama...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-muted/50 rounded-md p-4 text-sm">
        <p className="font-semibold">Info Kelas Saat Ini:</p>
        <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4">
          <li>Kode: {oldKelasData.kodeKelas}</li>
          <li>Level: {oldKelasData.level}</li>
          <li>Tahun Ajar: {oldKelasData.bulanTahunAjar}</li>
          <li>Harga Program Kelas: {oldKelasData.hargaKelas}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* New Level */}
        <FormField
          control={form.control}
          name="newLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level Baru</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: 2"
                  type="text"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    field.onChange(val);
                  }}
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Bulan/Tahun Ajar */}
        <FormField
          control={form.control}
          name="newBulanTahunAjar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bulan & Tahun Ajar Baru</FormLabel>
              <FormControl>
                <IMaskInput
                  mask="00/0000"
                  placeholder="MM/YYYY"
                  value={field.value ?? ""}
                  onAccept={(value: string) => field.onChange(value)}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  required
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="hargaKelas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Harga Program Kelas Baru</FormLabel>
            <FormControl>
              <Input
                placeholder="Masukkan harga program kelas"
                type="number"
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tanggal Mulai Efektif */}
      <FormStringDatePicker
        control={form.control}
        name="newTanggalMulai"
        label="Tanggal Mulai Efektif (Untuk Tagihan & Absen)"
      />

      {/* New Kode Kelas (Read Only / Auto Generated) */}
      <FormField
        control={form.control}
        name="newKodeKelas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kode Kelas Baru (Otomatis)</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled
                readOnly
                placeholder="Menunggu input..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  );
}
