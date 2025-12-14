"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { Control } from "react-hook-form";
import { cn } from "@/lib/utils"; // Pastikan Anda punya 'cn'

// --- Impor helper baru kita dari dateUtils ---
import { formatDateToYYYYMMDD, formatDateWITA } from "@/utils/dateUtils";
import dayjs from "@/utils/dateUtils"; // Impor dayjs dari util

interface FormStringDatePickerProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	control: Control<any>; // Tipe Control dari react-hook-form
	name: string; // Nama field
	label: string; // Label untuk FormLabel
	placeholder?: string;
	disabled?: boolean;
}

export function FormStringDatePicker({
	control,
	name,
	label,
	placeholder = "Pilih tanggal",
	disabled,
}: FormStringDatePickerProps) {
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
										field.value instanceof Date ? (
											formatDateWITA(field.value)
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
								// 'selected' butuh Date, jadi kita konversi string "YYYY-MM-DD"
								selected={
									field.value
										? field.value instanceof Date
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
