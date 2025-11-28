"use client";

import { useFormContext } from "react-hook-form";
import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import { useKelas } from "@/hooks/useKelas";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import type { TypeClientCreatePembayaranSchema } from "@/types/pembayaran.type";
import { toRupiah } from "@/utils/toRupiah";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";

interface PembayaranFormProps {
  onSubmit: (data: TypeClientCreatePembayaranSchema) => void;
}

export default function PembayaranForm({ onSubmit }: PembayaranFormProps) {
  const form = useFormContext<TypeClientCreatePembayaranSchema>();
  const { setValue } = form;

  // 1. State Lokal untuk Filter Kelas (Tidak masuk ke submit form, hanya helper UI)
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");

  // 2. Ambil Data Kelas (Untuk Dropdown 1 & Harga)
  const { dataKelasAktif } = useKelas({
    enableQueryGetKelasId: true, // Mengambil list kelas aktif
    enableQueryGetAll: false,
  });

  // 3. Ambil Data Siswa berdasarkan Kelas yang dipilih (Untuk Dropdown 2)
  const { dataByKelasId: listSiswa, isLoadingByKelasId } = usePendaftaranKelas({
    kelasId: selectedKelasId,
    enableQuery: !!selectedKelasId, // Hanya fetch jika kelas sudah dipilih
  });

  // 4. Efek: Auto-fill Harga & Reset Siswa saat Kelas berubah
  useEffect(() => {
    if (selectedKelasId && dataKelasAktif) {
      // Cari info kelas yang dipilih
      const targetKelas = dataKelasAktif.find((k) => k.id === selectedKelasId);

      // Jika kelas ditemukan, set harga default ke form
      if (targetKelas) {
        setValue("jumlahBayar", targetKelas.hargaKelas);
      }

      // Reset pilihan siswa karena kelas berubah
      setValue("pendaftaranKelasId", "");
    }
  }, [selectedKelasId, dataKelasAktif, setValue]);

  // 5. Efek: Auto-set Tanggal ke Hari Ini jika kosong
  useEffect(() => {
    if (!form.getValues("tanggalBayar")) {
      setValue("tanggalBayar", formatDateToYYYYMMDD(new Date()));
    }
  }, [setValue, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* --- HELPER UI: PILIH KELAS --- */}
      <div className="bg-muted/20 space-y-2 rounded-md border p-3">
        <FormLabel className="text-muted-foreground text-xs font-semibold uppercase">
          Langkah 1: Filter Kelas
        </FormLabel>
        <Select value={selectedKelasId} onValueChange={setSelectedKelasId}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Pilih Kelas Terlebih Dahulu" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Daftar Kelas Aktif</SelectLabel>
              {dataKelasAktif?.map((kelas) => (
                <SelectItem key={kelas.id} value={kelas.id}>
                  {kelas.kodeKelas} — {toRupiah(kelas.hargaKelas)} / Sesi
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* --- FORM FIELD: PENDAFTARAN ID --- */}
      <FormField
        control={form.control}
        name="pendaftaranKelasId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pilih Siswa</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedKelasId || isLoadingByKelasId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedKelasId
                        ? "Pilih kelas di atas dahulu..."
                        : isLoadingByKelasId
                          ? "Memuat siswa..."
                          : "Pilih Siswa"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {listSiswa?.length === 0 ? (
                    <div className="text-muted-foreground p-2 text-center text-sm">
                      Tidak ada siswa aktif di kelas ini
                    </div>
                  ) : (
                    listSiswa?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.murid.namaLengkap}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* --- FORM FIELD: JUMLAH BAYAR --- */}
      <FormField
        control={form.control}
        name="jumlahBayar"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jumlah Bayar (Rp)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Contoh: 500000"
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* --- FORM FIELD: TANGGAL BAYAR --- */}
      <FormStringDatePicker
        control={form.control}
        name="tanggalBayar"
        label="Tanggal Pembayaran"
        placeholder="Pilih tanggal"
      />

      {/* --- FORM FIELD: NOTE --- */}
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan (Opsional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Contoh: Pembayaran Cash di kantor"
                className="resize-none"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Hidden Field: Pembayaran Ke (Opsional, backend akan handle jika kosong) */}
      {/* Anda bisa menambahkan input manual jika ingin override urutan pembayaran */}
    </form>
  );
}
