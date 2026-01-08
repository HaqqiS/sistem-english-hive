"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import { Badge } from "@/components/ui/badge";
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
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useKelas } from "@/hooks/useKelas";
import { useMurid } from "@/hooks/useMurid";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { TypeClientBulkPendaftaranKelasSchema } from "@/types/pendaftaranKelas.type";

interface PendaftaranKelasFormProps {
	onSubmit: (data: TypeClientBulkPendaftaranKelasSchema) => void;
}

export default function PendaftaranKelasForm({
	onSubmit,
}: PendaftaranKelasFormProps) {
	const { activeCabangId } = useGlobalCabangStore();
	const form = useFormContext<TypeClientBulkPendaftaranKelasSchema>();
	const { dataMuridNotRegistered } = useMurid({
		enableNotRegisteredQuery: true,
		filterCabang: activeCabangId,
	});
	const { dataKelasAktif: dataKelas } = useKelas({
		enableQueryGetKelasAktif: true,
		filterCabang: activeCabangId,
	});

	// State for MultiSelect Popover
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [ageFilter, setAgeFilter] = React.useState({
		min: "",
		max: "",
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

	// Helper to remove selected item
	const handleUnselect = (item: string) => {
		const current = form.getValues("muridIds") || [];
		form.setValue(
			"muridIds",
			current.filter((i) => i !== item),
		);
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			{/* MULTI SELECT MURID */}
			<FormField
				control={form.control}
				name="muridIds"
				render={({ field }) => (
					<FormItem className="flex flex-col">
						<FormLabel>Pilih Murid (Maks 10)</FormLabel>
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<FormControl>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={open}
										className={cn(
											"h-auto min-h-10 w-full justify-between",
											!field.value?.length && "text-muted-foreground",
										)}
									>
										{field.value?.length > 0
											? `${field.value.length} murid dipilih`
											: "Pilih murid..."}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</FormControl>
							</PopoverTrigger>
							<PopoverContent className="w-md p-0">
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
														const current = field.value || [];
														if (current.includes(murid.id)) {
															form.setValue(
																"muridIds",
																current.filter((id) => id !== murid.id),
															);
														} else {
															if (current.length >= 10) return; // Max 10 constraint
															form.setValue("muridIds", [...current, murid.id]);
														}
													}}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															field.value?.includes(murid.id)
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

						{/* Selected Badges Area */}
						<div className="mt-2 flex flex-wrap gap-1">
							{field.value?.map((muridId) => {
								const murid = dataMuridNotRegistered?.find(
									(m) => m.id === muridId,
								);
								if (!murid) return null;
								return (
									<Badge
										variant="secondary"
										key={muridId}
										className="mr-1 mb-1 pr-0"
									>
										{murid.namaLengkap}
										<Button
											// <button
											// type="button"
											variant="ghost"
											size="icon-sm"
											className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
											onKeyDown={(e) => {
												if (e.key === "Enter") handleUnselect(muridId);
											}}
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											onClick={() => handleUnselect(muridId)}
										>
											<X className="text-muted-foreground hover:text-foreground h-3 w-3" />
										</Button>
									</Badge>
								);
							})}
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* KELAS SELECT (Tetap Single) */}
			<FormField
				control={form.control}
				name="kelasId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Program Kelas</FormLabel>
						<FormControl>
							<Select onValueChange={field.onChange} value={field.value}>
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

			{/* TANGGAL MULAI */}
			<FormStringDatePicker
				control={form.control}
				name="tanggalMulai"
				label="Tanggal Mulai"
			/>
		</form>
	);
}
