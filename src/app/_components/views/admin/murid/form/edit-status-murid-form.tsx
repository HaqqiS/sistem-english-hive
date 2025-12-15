"use client";

import { StatusMurid } from "@prisma/client";
import { useFormContext } from "react-hook-form";
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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { TypeUpdateStatusMuridSchema } from "@/types/murid.type";

// Simple schema for status update

interface EditStatusMuridFormProps {
	onSubmit: (data: TypeUpdateStatusMuridSchema) => void;
}

export default function EditStatusMuridForm({
	onSubmit,
}: EditStatusMuridFormProps) {
	const form = useFormContext<TypeUpdateStatusMuridSchema>();

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			<FormField
				control={form.control}
				name="statusMurid"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Status Murid</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Pilih Status" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{Object.values(StatusMurid).map((status) => (
									<SelectItem key={status} value={status}>
										{status
											.replaceAll("_", " ")
											.toLowerCase()
											.replace(/\b\w/g, (c) => c.toUpperCase())}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		</form>
	);
}
