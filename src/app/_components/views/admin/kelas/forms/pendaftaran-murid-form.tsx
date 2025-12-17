"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

import { useMurid } from "@/hooks/useMurid";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { TypeClientTambahMuridSchema } from "@/types/pendaftaranKelas.type";

interface PendaftaranMuridFormProps {
	onSubmit: (data: TypeClientTambahMuridSchema) => void;
}

export default function PendaftaranMuridForm({
	onSubmit,
}: PendaftaranMuridFormProps) {
	const { activeCabangId } = useGlobalCabangStore();
	const [open, setOpen] = useState(false);

	const form = useFormContext<TypeClientTambahMuridSchema>();

	const { dataMuridNotRegistered } = useMurid({
		filterCabang: activeCabangId,
		enableNotRegisteredQuery: true,
	});

	// const handleUnselect = (item: string) => {
	//   const current = form.getValues("muridId") || [];
	//   form.setValue(
	//     "muridId",
	//     current.filter((i) => i !== item),
	//   );
	// };

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<FormField
				control={form.control}
				name="muridId"
				render={({ field }) => (
					<FormItem className="flex flex-col">
						<FormLabel>Murid</FormLabel>
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<FormControl>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={open}
										className={cn(
											"w-full justify-between",
											!field.value && "text-muted-foreground",
										)}
									>
										{field.value
											? dataMuridNotRegistered?.find(
													(murid) => murid.id === field.value,
												)?.namaLengkap
											: "Pilih murid..."}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</FormControl>
							</PopoverTrigger>
							<PopoverContent className="w-md p-0" align="start">
								<Command>
									<CommandInput placeholder="Cari murid..." />
									<CommandList>
										<CommandEmpty>Tidak ada murid ditemukan.</CommandEmpty>
										<CommandGroup className="max-h-64 overflow-auto">
											{dataMuridNotRegistered?.map((murid) => (
												<CommandItem
													key={murid.id}
													value={murid.namaLengkap}
													onSelect={() => {
														form.setValue("muridId", murid.id);
														setOpen(false);
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															field.value === murid.id
																? "opacity-100"
																: "opacity-0",
														)}
													/>
													<div className="flex flex-col">
														<span>{murid.namaLengkap}</span>
														<span className="text-muted-foreground text-xs">
															{murid.umur} tahun - Kelas: {murid.kelasSekolah}
														</span>
													</div>
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormStringDatePicker
				control={form.control}
				name="tanggalMulai"
				label="Tanggal Mulai"
			/>
		</form>
	);
}
