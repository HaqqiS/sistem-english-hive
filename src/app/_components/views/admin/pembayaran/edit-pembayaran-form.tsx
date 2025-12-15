"use client";

import { StatusPembayaran } from "@prisma/client";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TypeClientUpdatePembayaranSchema } from "@/types/pembayaran.type"; // Updated import

interface EditPembayaranFormProps {
	onSubmit: (data: TypeClientUpdatePembayaranSchema) => void; // Updated type
}

export default function EditPembayaranForm({
	onSubmit,
}: EditPembayaranFormProps) {
	const form = useFormContext<TypeClientUpdatePembayaranSchema>(); // Updated generic
	const { watch, setValue } = form;

	// Watch status to conditionally show/hide Tanggal Bayar
	const statusBayar = watch("statusBayar");

	// Auto-set Tanggal Bayar to today if status changes to LUNAS and date is empty
	useEffect(() => {
		if (statusBayar === StatusPembayaran.LUNAS) {
			const currentVal = form.getValues("tanggalBayar");
			if (!currentVal) {
				// Format YYYY-MM-DD
				const today = new Date().toISOString().split("T")[0];
				setValue("tanggalBayar", today); // Now we pass a string, which matches the type!
			}
		}
	}, [statusBayar, setValue, form]);

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			{/* Status Pembayaran */}
			<FormField
				control={form.control}
				name="statusBayar"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Status Pembayaran</FormLabel>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Pilih Status" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value={StatusPembayaran.BELUM_LUNAS}>
									Belum Lunas
								</SelectItem>
								<SelectItem value={StatusPembayaran.PENDING}>
									Pending
								</SelectItem>
								<SelectItem value={StatusPembayaran.LUNAS}>Lunas</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Jumlah Bayar */}
			<FormField
				control={form.control}
				name="jumlahBayar"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Jumlah Bayar (Rp)</FormLabel>
						<FormControl>
							<Input
								type="number"
								placeholder="Masukkan nominal"
								{...field}
								onChange={(e) => field.onChange(e.target.valueAsNumber)}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Tanggal Bayar (Conditional) */}
			{statusBayar === StatusPembayaran.LUNAS && (
				<FormStringDatePicker
					control={form.control}
					name="tanggalBayar"
					label="Tanggal Pembayaran"
				/>
			)}

			{/* Catatan */}
			<FormField
				control={form.control}
				name="note"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Catatan (Opsional)</FormLabel>
						<FormControl>
							<Textarea
								placeholder="Contoh: Transfer BCA a.n Budi"
								className="resize-none"
								{...field}
								value={field.value ?? ""}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</form>
	);
}
