"use client";

import { useFormContext } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { TypeClientJamCustomSchema } from "@/types/jam.type";

interface JamFormProps {
	onSubmit: (data: TypeClientJamCustomSchema) => void;
}

export default function JamForm({ onSubmit }: JamFormProps) {
	const form = useFormContext<TypeClientJamCustomSchema>();

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="jamMulai"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Jam Mulai</FormLabel>
							<FormControl>
								<Input type="time" placeholder="14:30" {...field} required />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="jamSelesai"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Jam Selesai</FormLabel>
							<FormControl>
								<Input type="time" placeholder="17:00" {...field} required />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</form>
	);
}
