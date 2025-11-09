"use client";

import { type Control } from "react-hook-form";
import { format } from "date-fns";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatusAbsenGuru } from "@prisma/client";
import { useKelas } from "@/hooks/useKelas";
import { useRuang } from "@/hooks/useRuang";
import type { TypeFormSesiAbsensiGuru } from "@/types/absenGuru.type";
import { useState } from "react";
import dayjs, { JAM_MULAI_KELAS, TIMEZONE_BISNIS } from "@/utils/dateUtils";
import { ChevronDownIcon } from "lucide-react";

// 1. Definisikan props yang diterima dari parent
interface AbsensiGuruFormProps {
  control: Control<TypeFormSesiAbsensiGuru>;
  index: number;
  onRemove: (index: number) => void;
}

export default function AbsensiGuruForm({
  control,
  index,
  onRemove,
}: AbsensiGuruFormProps) {
  const { data: dataKelas, isLoading: isLoadingKelas } = useKelas();
  const { data: dataRuang, isLoading: isLoadingRuang } = useRuang();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <Card className="">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Absensi {index + 1}</CardTitle>
        {index > 0 && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemove(index)}
          >
            Hapus
          </Button>
        )}
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-4">
        <FormField
          control={control} // 4. Gunakan control dari props
          name={`absensi.${index}.kelasId`} // 5. Gunakan nama field yang benar
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Program Kelas</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingKelas}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingKelas ? "Loading..." : "Pilih Program Kelas"
                      }
                    />
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
          control={control}
          name={`absensi.${index}.ruangId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruang</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingRuang}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingRuang ? "Loading..." : "Pilih Ruang"
                      }
                    />
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
          control={control}
          name={`absensi.${index}.tanggalWaktu`}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal & Waktu Sesi (WITA)</FormLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* === INPUT TANGGAL === */}
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {field.value
                        ? dayjs(field.value)
                            .tz(TIMEZONE_BISNIS)
                            .format("DD MMMM YYYY")
                        : "Pilih Tanggal"}
                      <ChevronDownIcon />
                    </Button>
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
                  <SelectTrigger className="w-full">
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

        <FormField
          control={control}
          name={`absensi.${index}.status`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={StatusAbsenGuru.HADIR}>Hadir</SelectItem>
                  <SelectItem value={StatusAbsenGuru.ALPA}>
                    Tidak Hadir
                  </SelectItem>
                  <SelectItem value={StatusAbsenGuru.IJIN}>Izin</SelectItem>
                  <SelectItem value={StatusAbsenGuru.SAKIT}>Sakit</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
