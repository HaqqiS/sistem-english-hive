"use client";

import { format, isValid, parse } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import dayjs, { TIMEZONE_BISNIS } from "@/utils/dateUtils";

const FORMAT_TANGGAL = "yyyy-MM-dd";

const keDate = (v?: string | null): Date | undefined => {
	if (!v) return undefined;
	const d = parse(v, FORMAT_TANGGAL, new Date());
	return isValid(d) ? d : undefined;
};

const keString = (d: Date) => format(d, FORMAT_TANGGAL);

/** Tanggal "hari ini" menurut zona waktu bisnis (WITA). */
const hariIniWITA = () => dayjs().tz(TIMEZONE_BISNIS).format("YYYY-MM-DD");
const kemarinWITA = () =>
	dayjs().tz(TIMEZONE_BISNIS).subtract(1, "day").format("YYYY-MM-DD");

interface DatePickerStringProps {
	id?: string;
	/** Tanggal "YYYY-MM-DD". String kosong = belum dipilih. */
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	/** Nonaktifkan tanggal setelah hari ini (WITA). Default: false. */
	disableFuture?: boolean;
	/** Tampilkan pintasan "Hari ini" & "Kemarin". Default: true. */
	showShortcuts?: boolean;
	className?: string;
	"aria-invalid"?: boolean;
}

/**
 * Pemilih tanggal berbasis kalender (tanpa mengetik). Nilai berupa string
 * "YYYY-MM-DD" sehingga langsung cocok dengan state/field form yang ada.
 * Dilengkapi pintasan "Hari ini" dan "Kemarin" untuk input yang lebih cepat.
 */
export function DatePickerString({
	id,
	value,
	onChange,
	placeholder = "Pilih tanggal",
	disabled,
	disableFuture = false,
	showShortcuts = true,
	className,
	"aria-invalid": ariaInvalid,
}: DatePickerStringProps) {
	const [open, setOpen] = useState(false);
	const selected = keDate(value);

	const pilih = (v: string) => {
		onChange(v);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					disabled={disabled}
					aria-invalid={ariaInvalid}
					className={cn(
						"h-10 w-full justify-between pl-3 text-left font-normal",
						!selected && "text-muted-foreground",
						className,
					)}
				>
					<span className="truncate">
						{selected
							? format(selected, "EEEE, d MMMM yyyy", { locale: localeId })
							: placeholder}
					</span>
					<CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					locale={localeId}
					defaultMonth={selected ?? keDate(hariIniWITA())}
					selected={selected}
					disabled={
						disableFuture
							? (date: Date) => keString(date) > hariIniWITA()
							: undefined
					}
					onSelect={(d) => d && pilih(keString(d))}
					autoFocus
				/>
				{showShortcuts && (
					<div className="flex gap-2 border-t p-3">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="flex-1"
							onClick={() => pilih(hariIniWITA())}
						>
							Hari ini
						</Button>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="flex-1"
							onClick={() => pilih(kemarinWITA())}
						>
							Kemarin
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}