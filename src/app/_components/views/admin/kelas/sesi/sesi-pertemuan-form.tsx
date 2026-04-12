"use client";
import { useFormContext } from "react-hook-form";
import { FormDateTimeDatePicker } from "@/app/_components/shared/FormDateTimeDatePicker";
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
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useKelas } from "@/hooks/useKelas";
import { useRuang } from "@/hooks/useRuang";
import type { TypeClientSesiPertemuanSchema } from "@/types/sesiPertemuan.type";

interface SesiPertemuanFormProps {
	onSubmit: (data: TypeClientSesiPertemuanSchema) => void;
	cabangId?: string;
}

export default function SesiPertemuanForm({
	onSubmit,
	cabangId,
}: SesiPertemuanFormProps) {
	const form = useFormContext<TypeClientSesiPertemuanSchema>();

	const { dataKelasAktif: dataKelas } = useKelas({
		enableQueryGetKelasAktif: true,
		filterCabang: cabangId,
	});
	const { data: dataRuang } = useRuang({
		enableQuery: true,
		filterCabang: cabangId,
	});

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<FormField
				control={form.control}
				name="kelasId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Nama Program Kelas</FormLabel>
						<FormControl>
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih Program Kelas" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
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
				name="ruangId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Ruang</FormLabel>
						<FormControl>
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih Ruang" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{dataRuang?.map((ruang) => (
											<SelectItem key={ruang.id} value={ruang.id}>
												{ruang.namaRuang}
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

			<FormDateTimeDatePicker
				control={form.control}
				name="tanggalWaktu"
				label="Tanggal"
				placeholder="Pilih Tanggal"
			/>
		</form>
	);
}
