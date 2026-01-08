"use client";

import { StatusPendaftaran } from "@prisma/client";
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
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	const [searchQuery, setSearchQuery] = useState("");
	const [ageFilter, setAgeFilter] = useState({
		min: "",
		max: "",
	});

	const form = useFormContext<TypeClientTambahMuridSchema>();

	const { dataMuridNotRegistered } = useMurid({
		filterCabang: activeCabangId,
		enableNotRegisteredQuery: true,
	});

	const filteredMurid = dataMuridNotRegistered
		?.filter((murid) => {
			const age = murid.umur ?? 0;
			const min = ageFilter.min ? Number(ageFilter.min) : 0;
			const max = ageFilter.max ? Number(ageFilter.max) : Infinity;

			// Filter Age
			if (age < min || age > max) return false;

			// Filter Search
			if (
				searchQuery &&
				!murid.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase())
			) {
				return false;
			}

			return true;
		})
		.slice(0, 50);

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
								<Command shouldFilter={false}>
									<CommandInput
										placeholder="Cari murid..."
										value={searchQuery}
										onValueChange={setSearchQuery}
									/>
									<div className="p-2 border-b space-y-2">
										<p className="text-xs font-medium text-muted-foreground">
											Filter Umur
										</p>
										<div className="flex gap-2">
											<div className="space-y-1">
												<Input
													placeholder="Min"
													type="number"
													className="h-7 text-xs"
													value={ageFilter.min}
													onChange={(e) =>
														setAgeFilter((prev) => ({
															...prev,
															min: e.target.value,
														}))
													}
												/>
											</div>
											<div className="space-y-1">
												<Input
													placeholder="Max"
													type="number"
													className="h-7 text-xs"
													value={ageFilter.max}
													onChange={(e) =>
														setAgeFilter((prev) => ({
															...prev,
															max: e.target.value,
														}))
													}
												/>
											</div>
										</div>
									</div>
									<CommandList>
										<CommandEmpty>Tidak ada murid ditemukan.</CommandEmpty>
										<CommandGroup>
											{filteredMurid?.map((murid) => (
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
														<span className="text-xs opacity-80">
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
									if (val === StatusPendaftaran.WAITING_LIST) {
										form.setValue("tanggalMulai", null);
									}
								}}
								value={field.value}
								defaultValue={StatusPendaftaran.AKTIF}
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
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

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
