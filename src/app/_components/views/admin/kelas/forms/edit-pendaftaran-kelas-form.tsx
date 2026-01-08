"use client";
import { StatusPendaftaran } from "@prisma/client";

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
import { usePendaftaranKelasStore } from "@/store/useKelasStore";
import type { TypeClientUpdatePendaftaranKelasSchema } from "@/types/pendaftaranKelas.type";

interface EditPendaftaranKelasFormProps {
	onSubmit: (data: TypeClientUpdatePendaftaranKelasSchema) => void;
}

export default function EditPendaftaranKelasForm({
	onSubmit,
}: EditPendaftaranKelasFormProps) {
	// const { activeCabangId } = useGlobalCabangStore(); // Unused
	const form = useFormContext<TypeClientUpdatePendaftaranKelasSchema>();
	const { selectedPendaftaran } = usePendaftaranKelasStore();

	// Removed heavy hooks: useMurid, useKelas

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			{/* Murid Selection - Disabled / Read Only */}
			<div className="space-y-2">
				<FormLabel>Murid</FormLabel>
				<Input
					disabled
					value={selectedPendaftaran?.murid.namaLengkap || "-"}
					placeholder="Nama Murid"
				/>
			</div>

			{/* Kelas Selection - Disabled / Read Only */}
			<div className="space-y-2">
				<FormLabel>Program Kelas</FormLabel>
				<Input
					disabled
					value={selectedPendaftaran?.Kelas.kodeKelas || "-"}
					placeholder="Kode Kelas"
				/>
			</div>

			<FormField
				control={form.control}
				name="status"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Status Pendaftaran</FormLabel>
						<FormControl>
							<Select
								onValueChange={(val) => {
									field.onChange(val);
									// Jika ganti ke WAITING LIST, kosongkan tanggal mulai (opsional)
									if (val === StatusPendaftaran.WAITING_LIST) {
										form.setValue("tanggalMulai", null);
									}
								}}
								value={field.value}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={StatusPendaftaran.AKTIF}>Aktif</SelectItem>
									<SelectItem value={StatusPendaftaran.TRIAL}>Trial</SelectItem>
									<SelectItem value={StatusPendaftaran.WAITING_LIST}>
										Waiting List
									</SelectItem>
									<SelectItem value={StatusPendaftaran.NON_AKTIF}>
										Non-Aktif
									</SelectItem>
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Tanggal Mulai (Hanya muncul jika bukan Waiting List) */}
			{form.watch("status") !== StatusPendaftaran.WAITING_LIST && (
				<FormStringDatePicker
					control={form.control}
					name="tanggalMulai"
					label="Tanggal Mulai"
				/>
			)}
		</form>
	);
}
