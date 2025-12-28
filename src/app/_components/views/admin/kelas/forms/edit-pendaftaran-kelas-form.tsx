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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useKelas } from "@/hooks/useKelas";
import { useMurid } from "@/hooks/useMurid";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { TypeClientUpdatePendaftaranKelasSchema } from "@/types/pendaftaranKelas.type";

interface EditPendaftaranKelasFormProps {
	onSubmit: (data: TypeClientUpdatePendaftaranKelasSchema) => void;
}

export default function EditPendaftaranKelasForm({
	onSubmit,
}: EditPendaftaranKelasFormProps) {
	const { activeCabangId } = useGlobalCabangStore();
	const form = useFormContext<TypeClientUpdatePendaftaranKelasSchema>();

	const {
		dataAllMuridPaginated: dataAllMurid,
		// isLoadingAllMuridPaginated: isLoadingMurid,
	} = useMurid({
		pagination: {
			pageSize: 20,
			pageIndex: 0,
		},
		filterCabang: activeCabangId,
		enableQuery: true,
	});
	const {
		dataKelasAktif: dataKelas,
		//  isLoadingKelasAktif: isLoadingKelas
	} = useKelas({
		filterCabang: activeCabangId,
		enableQueryGetKelasAktif: true,
	});

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			{/* Murid Selection */}
			<FormField
				control={form.control}
				name="muridId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Murid</FormLabel>
						<FormControl>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								disabled={true}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih Murid" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Pilih Murid</SelectLabel>
										{dataAllMurid?.map((murid) => (
											<SelectItem key={murid.id} value={murid.id}>
												{murid.namaLengkap}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Kelas Selection */}
			<FormField
				control={form.control}
				name="kelasId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Program Kelas</FormLabel>
						<FormControl>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								disabled={true}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih Program Kelas" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Tipe Program Kelas</SelectLabel>
										{dataKelas?.map((kelas) => (
											<SelectItem key={kelas.id} value={kelas.id}>
												{kelas.kodeKelas}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

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
