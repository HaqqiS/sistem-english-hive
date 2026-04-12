"use client";

import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import dayjs, { formatToWITA, TIMEZONE_BISNIS } from "@/utils/dateUtils";

interface DateTimeDatePickerProps {
	value: Date | undefined | null;
	onChange: (date: Date) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function DateTimeDatePicker({
	value,
	onChange,
	placeholder = "Pilih Tanggal",
	disabled,
	className,
}: DateTimeDatePickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleSelect = (newDate: Date | undefined) => {
		if (!newDate) return;

		// 1. Ambil jam & menit WITA yang ada (atau 'Now' jika baru)
		const currentDateTime = value
			? dayjs(value).tz(TIMEZONE_BISNIS)
			: dayjs().tz(TIMEZONE_BISNIS);

		// 2. Gabungkan Tanggal baru dengan Jam & Menit lama/sekarang
		const localDateTime = dayjs(newDate)
			.hour(currentDateTime.hour())
			.minute(currentDateTime.minute())
			.second(0)
			.millisecond(0);

		// 3. Konversi kembali ke UTC Date object untuk disimpan
		const dateToSave = dayjs
			.tz(localDateTime.format("YYYY-MM-DDTHH:mm:ss"), TIMEZONE_BISNIS)
			.toDate();

		onChange(dateToSave);
		setIsOpen(false);
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"w-full justify-between text-left font-normal",
						!value && "text-muted-foreground",
						className,
					)}
				>
					{value ? formatToWITA(value, "DD MMMM YYYY") : placeholder}
					<div className="flex items-center gap-1 opacity-50">
						<CalendarIcon className="h-4 w-4" />
						<ChevronDownIcon className="h-3 w-3" />
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value ? new Date(value) : undefined}
					onSelect={handleSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
