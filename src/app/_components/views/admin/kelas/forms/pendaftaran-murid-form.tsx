"use client";

import { useMurid } from "@/hooks/useMurid";
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
import type { TypeClientTambahMuridSchema } from "@/types/pendaftaranKelas.type";
import { useFormContext } from "react-hook-form";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Check, ChevronsUpDown } from "lucide-react";
// import { Badge } from "@/components/ui/badge";

interface PendaftaranMuridFormProps {
  onSubmit: (data: TypeClientTambahMuridSchema) => void;
}

export default function PendaftaranMuridForm({
  onSubmit,
}: PendaftaranMuridFormProps) {
  // const [open, setOpen] = useState(false);

  const form = useFormContext<TypeClientTambahMuridSchema>();

  const { dataMuridNotRegistered } = useMurid();

  // const handleUnselect = (item: string) => {
  //   const current = form.getValues("muridId") || [];
  //   form.setValue(
  //     "muridId",
  //     current.filter((i) => i !== item),
  //   );
  // };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="muridId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Murid</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Murid" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Pilih Murid</SelectLabel>
                    {dataMuridNotRegistered?.map((murid) => (
                      <SelectItem key={murid.id} value={murid.id}>
                        <div className="flex flex-col">
                          <span>{murid.namaLengkap}</span>
                          <span className="text-muted-foreground text-xs">
                            {murid.umur} tahun - Kelas: {murid.kelasSekolah}
                          </span>
                        </div>
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

      {/* <FormField
        control={form.control}
        name="muridId"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Pilih Murid (Maks 10)</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      "h-auto min-h-10 w-full justify-between",
                      !field.value?.length && "text-muted-foreground",
                    )}
                  >
                    {field.value?.length > 0
                      ? `${field.value.length} murid dipilih`
                      : "Pilih murid..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-md p-0">
                <Command>
                  <CommandInput placeholder="Cari murid..." />
                  <CommandList>
                    <CommandEmpty>Tidak ada murid ditemukan.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {dataMuridNotRegistered?.map((murid) => (
                        <CommandItem
                          key={murid.id}
                          value={murid.namaLengkap}
                          onSelect={() => {
                            const current = field.value || [];
                            if (current.includes(murid.id)) {
                              form.setValue(
                                "muridIds",
                                current.filter((id) => id !== murid.id),
                              );
                            } else {
                              if (current.length >= 10) return; // Max 10 constraint
                              form.setValue("muridIds", [...current, murid.id]);
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value?.includes(murid.id)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{murid.namaLengkap}</span>
                            <span className="text-muted-foreground text-xs">
                              {murid.umur} tahun - Kelas: {murid.kelasSekolah}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected Badges Area */}
      {/* <div className="mt-2 flex flex-wrap gap-1">
              {field.value?.map((muridId) => {
                const murid = dataMuridNotRegistered?.find(
                  (m) => m.id === muridId,
                );
                if (!murid) return null;
                return (
                  <Badge
                    variant="secondary"
                    key={muridId}
                    className="mr-1 mb-1"
                  >
                    {murid.namaLengkap}
                    <button
                      className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUnselect(muridId);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleUnselect(muridId)}
                    >
                      <X className="text-muted-foreground hover:text-foreground h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      /> */}

      <FormStringDatePicker
        control={form.control}
        name="tanggalMulai"
        label="Tanggal Mulai"
      />
    </form>
  );
}
