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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TypeClientSesiPertemuanSchema } from "@/types/sesiPertemuan.type";
import { useFormContext } from "react-hook-form";
import { useKelas } from "@/hooks/useKelas";
import { useRuang } from "@/hooks/useRuang";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dayjs, { JAM_MULAI_KELAS, TIMEZONE_BISNIS } from "@/utils/dateUtils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";

interface SesiPertemuanFormProps {
  onSubmit: (data: TypeClientSesiPertemuanSchema) => void;
}

export default function SesiPertemuanForm({
  onSubmit,
}: SesiPertemuanFormProps) {
  const form = useFormContext<TypeClientSesiPertemuanSchema>();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { dataKelasAktif: dataKelas } = useKelas();
  const { data: dataRuang } = useRuang();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="kelasId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Program Kelas</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Program Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {dataKelas?.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.kodeKelas}
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
        name="ruangId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ruang</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Ruang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {dataRuang?.map((ruang) => (
                      <SelectItem key={ruang.id} value={ruang.id}>
                        {ruang.namaRuang}
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
        name="tanggalWaktu"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Tanggal & Waktu Sesi (WITA)</FormLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* === INPUT TANGGAL === */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {field.value
                      ? dayjs(field.value)
                          .tz(TIMEZONE_BISNIS)
                          .format("DD MMMM YYYY")
                      : "Pilih Tanggal"}
                    <ChevronDownIcon />
                  </Button>

                  {/* <Button
                    variant="outline"
                    id="date"
                    className="w-full justify-between"
                  >
                    {field.value
                      ? dayjs(field.value)
                          .tz(TIMEZONE_BISNIS)
                          .format("DD MMMM YYYY")
                      : "Pilih Tanggal"}
                    <ChevronDownIcon />
                  </Button> */}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(newDate) => {
                      if (!newDate) return;

                      // === LANGKAH 3 (KONVERSI) ===
                      // 1. Ambil jam & menit WITA yang ada
                      const currentTime = field.value
                        ? dayjs(field.value).tz(TIMEZONE_BISNIS)
                        : dayjs().tz(TIMEZONE_BISNIS).hour(16).minute(0); // Default ke 16:00

                      // 2. Buat tanggal-waktu LOKAL (WITA) baru
                      const localDateTime = dayjs(newDate)
                        .hour(currentTime.hour())
                        .minute(currentTime.minute())
                        .second(0);

                      // 3. Konversi ke Date object (UTC) untuk disimpan
                      const dateToSave = dayjs
                        .tz(
                          localDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                          TIMEZONE_BISNIS,
                        )
                        .toDate();

                      field.onChange(dateToSave);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* === INPUT JAM === */}
              <Select
                value={
                  field.value
                    ? dayjs(field.value).tz(TIMEZONE_BISNIS).format("HH:mm")
                    : ""
                }
                onValueChange={(newTime) => {
                  // --- PERBAIKAN DI SINI ---
                  // 'newTime' adalah "HH:mm", e.g., "16:00"
                  // Kita pisahkan dan konversi, beri fallback 0 jika gagal
                  const hour = Number(newTime.split(":")[0]) || 0;
                  const minute = Number(newTime.split(":")[1]) || 0;
                  // Tipe 'hour' dan 'minute' sekarang dijamin 'number'

                  // === LANGKAH 3 (KONVERSI) ===
                  // 1. Ambil tanggal WITA yang ada
                  const currentDate = field.value
                    ? dayjs(field.value).tz(TIMEZONE_BISNIS)
                    : dayjs().tz(TIMEZONE_BISNIS);

                  // 2. Buat tanggal-waktu LOKAL (WITA) baru
                  const localDateTime = currentDate
                    .hour(hour)
                    .minute(minute)
                    .second(0);

                  // 3. Konversi ke Date object (UTC) untuk disimpan
                  const dateToSave = dayjs
                    .tz(
                      localDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                      TIMEZONE_BISNIS,
                    )
                    .toDate();

                  field.onChange(dateToSave);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {JAM_MULAI_KELAS.map((jam) => (
                      <SelectItem key={jam} value={jam}>
                        {jam}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  );
}
