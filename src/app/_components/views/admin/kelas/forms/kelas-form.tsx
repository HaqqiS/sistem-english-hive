/* eslint-disable @typescript-eslint/no-explicit-any */
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IMaskInput } from "react-imask";
import type { TypeClientKelasSchema } from "@/types/kelas.type";
import { TipeKelas, JenisKelas } from "@prisma/client";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

interface KelasFormProps {
  onSubmit: (data: TypeClientKelasSchema) => void;
}

const safeVal = (val: string | number | null | undefined) => val ?? "";

const generateKodeKelas = (
  jenis: string,
  level: number | string,
  grup: string,
  tipe: string,
  bulanTahun: string,
) => {
  // Hanya buat kode jika semua field penting sudah diisi
  if (jenis && level && grup && tipe && bulanTahun) {
    // e.g., "TinyTods 1-A|REGULAR|03/2025"
    return `${jenis} ${safeVal(level)}-${safeVal(grup)} | ${safeVal(tipe)} | ${safeVal(bulanTahun)}`;
  }
  return ""; // Kembalikan string kosong jika belum lengkap
};

export default function KelasForm({ onSubmit }: KelasFormProps) {
  const form = useFormContext<TypeClientKelasSchema>();

  const { watch, setValue } = form;

  // 2. Awasi semua field yang relevan
  const watchedFields = watch([
    "jenisKelas",
    "level",
    "grup",
    "tipe",
    "bulanTahunAjar",
  ]);

  useEffect(() => {
    const [jenis, level, grup, tipe, bulanTahun] = watchedFields;

    const newKodeKelas = generateKodeKelas(
      jenis,
      level,
      grup,
      tipe,
      bulanTahun,
    );

    setValue("kodeKelas", newKodeKelas, {
      shouldValidate: true, // Opsional: jalankan validasi
      shouldDirty: true, // Opsional: tandai bahwa form sudah berubah
    });
  }, [watchedFields, setValue]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="jenisKelas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kelas</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Jenis Program Kelas</SelectLabel>
                      {Object.values(JenisKelas).map((jenis) => (
                        <SelectItem key={jenis} value={jenis}>
                          {jenis}
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
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level </FormLabel>
              <FormControl>
                {/* <Input placeholder="1-8" type="number" {...field} required /> */}
                <Input
                  placeholder="1-8"
                  type="text" // Gunakan 'text' untuk kontrol penuh
                  inputMode="numeric" // Tampilkan keyboard angka di HP
                  {...field}
                  onChange={(e) => {
                    // Hapus semua karakter non-digit
                    const numericValue = e.target.value.replace(/[^0-9]/g, "");
                    // Kirim nilai yang sudah bersih ke react-hook-form
                    field.onChange(numericValue);
                  }}
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe </FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue=""
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Tipe Program Kelas</SelectLabel>
                      <SelectItem value={TipeKelas.REGULAR}>
                        {TipeKelas.REGULAR}
                      </SelectItem>
                      <SelectItem value={TipeKelas.PRIVATE}>
                        {TipeKelas.PRIVATE}
                      </SelectItem>
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
          name="grup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grup</FormLabel>
              <FormControl>
                <Input
                  placeholder="A"
                  type="text"
                  {...field}
                  onChange={(e) => {
                    const cleanedValue = e.target.value
                      .toUpperCase() // 1. Ubah ke huruf besar
                      .replace(/[^A-Z]/g, "") // 2. Hapus non-huruf
                      .slice(0, 2); // 3. Batasi maksimal 2 karakter
                    field.onChange(cleanedValue);
                  }}
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="bulanTahunAjar"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bulan dan Tahun Ajar</FormLabel>
            <FormControl>
              <IMaskInput
                mask="00/0000" // '0' = digit. Ini akan jadi "MM/YYYY"
                placeholder="MM/YYYY"
                // 4. Hubungkan ke react-hook-form
                value={field.value ?? ""}
                onAccept={(value: any) => {
                  // 'onAccept' adalah cara imask menggantikan 'onChange'
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                inputRef={field.ref} // <-- 5. Jangan lupa pass 'ref'
                required
                className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:outline-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="kodeKelas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kode Kelas</FormLabel>
            <FormControl>
              <Input
                placeholder="TinyTods 1-A|reguler|03/2025"
                type="text"
                {...field}
                required
                disabled
                readOnly
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hargaKelas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Harga Program Kelas</FormLabel>
            <FormControl>
              <Input
                placeholder="Masukkan harga program kelas"
                type="number"
                {...field}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="deskripsi"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Deskripsi</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Masukkan deskripsi program kelas"
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
