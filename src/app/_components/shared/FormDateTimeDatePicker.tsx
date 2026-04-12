"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { DateTimeDatePicker } from "./DateTimeDatePicker";

interface FormDateTimeDatePickerProps<TFieldValues extends FieldValues> {
	control: Control<TFieldValues>;
	name: Path<TFieldValues>;
	label: string;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function FormDateTimeDatePicker<TFieldValues extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	disabled,
	className,
}: FormDateTimeDatePickerProps<TFieldValues>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex flex-col">
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<DateTimeDatePicker
							value={field.value}
							onChange={field.onChange}
							placeholder={placeholder}
							disabled={disabled}
							className={className}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
