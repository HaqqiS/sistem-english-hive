"use client";

import { id as localeId } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // Pastikan Anda punya 'cn'
// --- Impor helper baru kita dari dateUtils ---
import dayjs, { formatDateToYYYYMMDD, formatDateWITA } from "@/utils/dateUtils";

interface FormStringDatePickerProps<TFieldValues extends FieldValues> {
	control: Control<TFieldValues>;
	name: Path<TFieldValues>;
	label: string; // Label untuk FormLabel
	placeholder?: string;
	disabled?: boolean;
	/** Tampilkan dropdown bulan & tahun (cocok untuk tanggal lahir). Default: false. */
	showYearDropdown?: boolean;
	/** Tahun paling awal di dropdown tahun (dipakai jika showYearDropdown). */
	startYear?: number;
	/** Nonaktifkan tanggal setelah hari ini. Default: false. */
	disableFuture?: boolean;
	/** Bulan yang tampil saat belum ada tanggal terpilih. */
	defaultMonth?: Date;
}

export function FormStringDatePicker<TFieldValues extends FieldValues>({
	control,
	name,
	label,
	placeholder = "Pilih tanggal",
	disabled,
	showYearDropdown = false,
	startYear = 1940,
	disableFuture = false,
	defaultMonth,
}: FormStringDatePickerProps<TFieldValues>) {
	const [open, setOpen] = useState(false);

	// 'field.value' sekarang adalah string "YYYY-MM-DD"

	return (
		<FormField
			control={control}
			name={name}
			disabled={disabled}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<FormControl>
								<Button
									variant={"outline"}
									className={cn(
										"w-full pl-3 text-left font-normal",
										!field.value && "text-muted-foreground",
									)}
								>
									{field.value ? (
										// Ensure we pass a string (or Date) to formatDateWITA instead of an unsafe any
										typeof field.value === "string" ||
										(field.value as unknown) instanceof Date ? (
											formatDateWITA(field.value as string | Date)
										) : (
											formatDateWITA(String(field.value))
										)
									) : (
										<span>{placeholder}</span>
									)}
									<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
								</Button>
							</FormControl>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								// Opsi tambahan (hanya aktif jika diminta, pemakai lama tidak berubah)
								captionLayout={showYearDropdown ? "dropdown" : "label"}
								locale={showYearDropdown ? localeId : undefined}
								startMonth={
									showYearDropdown ? new Date(startYear, 0) : undefined
								}
								endMonth={showYearDropdown ? new Date() : undefined}
								disabled={disableFuture ? { after: new Date() } : undefined}
								defaultMonth={defaultMonth}
								// 'selected' butuh Date, jadi kita konversi string "YYYY-MM-DD"
								selected={
									field.value
										? (field.value as unknown) instanceof Date
											? field.value
											: dayjs(String(field.value)).toDate()
										: undefined
								}
								onSelect={(newDate) => {
									if (!newDate) return;

									// --- INI PERBAIKAN UTAMA ---
									// Konversi Date object dari kalender ke string "YYYY-MM-DD"
									field.onChange(formatDateToYYYYMMDD(newDate));

									setOpen(false);
								}}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
