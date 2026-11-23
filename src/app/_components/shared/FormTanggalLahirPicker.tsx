"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { formatTanggalLahirInput } from "@/lib/hitung-umur";
import { TanggalLahirPicker } from "./TanggalLahirPicker";

interface FormTanggalLahirPickerProps<TFieldValues extends FieldValues> {
	control: Control<TFieldValues>;
	name: Path<TFieldValues>;
	label: string;
	placeholder?: string;
	lang?: "id" | "en";
	disabled?: boolean;
}

/** Versi react-hook-form dari TanggalLahirPicker (menerima Date / ISO / "YYYY-MM-DD"). */
export function FormTanggalLahirPicker<TFieldValues extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	lang,
	disabled,
}: FormTanggalLahirPickerProps<TFieldValues>) {
	return (
		<FormField
			control={control}
			name={name}
			disabled={disabled}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<TanggalLahirPicker
							value={formatTanggalLahirInput(field.value)}
							onChange={field.onChange}
							lang={lang}
							placeholder={placeholder}
							disabled={disabled}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}