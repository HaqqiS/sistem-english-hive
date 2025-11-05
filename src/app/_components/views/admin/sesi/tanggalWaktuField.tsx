import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { ControllerRenderProps } from "react-hook-form";
import type { TypeClientSesiPertemuanSchema } from "@/types/sesiPertemuan.type";
import { isValidDate } from "@/utils/dateUtils";

// 🔧 helper
function formatDate(date?: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function TanggalWaktuField({
  field,
}: {
  field: ControllerRenderProps<TypeClientSesiPertemuanSchema, "tanggalWaktu">;
}) {
  const value = field.value ? new Date(field.value as unknown as Date) : null;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(
    value ? new Date(value) : new Date(),
  );
  const [textValue, setTextValue] = useState<string>(
    value ? formatDate(value) : "",
  );

  return (
    <FormItem>
      <FormLabel>Tanggal & Waktu</FormLabel>
      <FormControl>
        <div className="flex flex-col gap-4 md:flex-row">
          {/* 📅 DATE PICKER */}
          <div className="flex flex-col gap-2">
            <label htmlFor="date-input" className="px-1 text-sm font-medium">
              Tanggal
            </label>
            <div className="relative flex gap-2">
              <Input
                id="date-input"
                value={textValue}
                placeholder="Contoh: 02 November 2025"
                className="bg-background pr-10"
                onChange={(e) => {
                  const input = e.target.value;
                  setTextValue(input);
                  const parsed = new Date(input);
                  if (isValidDate(parsed)) {
                    const current = value ?? new Date();
                    parsed.setHours(current.getHours());
                    parsed.setMinutes(current.getMinutes());
                    field.onChange(parsed);
                    setMonth(parsed);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(true);
                  }
                }}
              />
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                  >
                    <CalendarIcon className="size-3.5" />
                    <span className="sr-only">Select date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="end"
                  alignOffset={-8}
                  sideOffset={10}
                >
                  <Calendar
                    mode="single"
                    selected={value ?? new Date()}
                    month={month}
                    onMonthChange={setMonth}
                    onSelect={(selected) => {
                      if (!selected) return;
                      const newDate = new Date(selected);
                      const current = value ?? new Date();
                      newDate.setHours(current.getHours());
                      newDate.setMinutes(current.getMinutes());
                      field.onChange(newDate);
                      setTextValue(formatDate(newDate));
                      setOpen(false);
                    }}
                    captionLayout="dropdown"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* ⏰ TIME PICKER */}
          <div className="flex flex-col gap-2">
            <label htmlFor="time-picker" className="px-1 text-sm font-medium">
              Waktu
            </label>
            <Input
              type="time"
              id="time-picker"
              step="60"
              value={
                value
                  ? value
                      .toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                      .replace(".", ":")
                  : "10:00"
              }
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(":");
                const newDate = value ?? new Date();
                newDate.setHours(Number(hours));
                newDate.setMinutes(Number(minutes));
                field.onChange(newDate);
              }}
              className="bg-background w-[140px] appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </div>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

export default TanggalWaktuField;
