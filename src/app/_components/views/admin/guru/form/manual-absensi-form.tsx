"use client";

import { StatusAbsenGuru } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"; // Added CalendarIcon
import { useEffect, useMemo } from "react"; // Added useEffect
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // Added Calendar
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
	FormDescription, // Added FormDescription
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input"; // Added Input
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useKelas } from "@/hooks/useKelas";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { TypeManualAbsensiFormSchema } from "@/types/absenGuru.type";

interface ManualAbsensiFormProps {
	onSubmit: (values: TypeManualAbsensiFormSchema) => void;
	defaultGuruId?: string;
}

export default function ManualAbsensiForm({
	onSubmit,
	defaultGuruId,
}: ManualAbsensiFormProps) {
	const { activeCabangId } = useGlobalCabangStore();

	// Use Form Context
	const form = useFormContext<TypeManualAbsensiFormSchema>();

	// Add local state for date + time handling if needed, or use form fields
	// We'll use form fields: tanggalWaktu (Date) and time (string)

	const watchedGuruId = form.watch("guruId");
	const watchedGuruAsliId = form.watch("guruAsliId");
	const isSubstitute = form.watch("isSubstitute");

	// Initial set of defaultGuruId
	useEffect(() => {
		if (defaultGuruId && !watchedGuruId) {
			form.setValue("guruId", defaultGuruId);
		}
	}, [defaultGuruId, watchedGuruId, form]);

	// 1. Fetch Data Guru (All)
	const { dataComplete: listGuru } = useUser({
		filterCabang: activeCabangId,
		enableQuery: true,
	});

	const guruOptions =
		listGuru?.map((g) => ({
			label: g.name ?? "Tanpa Nama",
			value: g.id,
		})) ?? [];

	// Determine whose classes to fetch
	// If Substitute: Fetch classes of 'guruAsliId'
	// If Regular: Fetch classes of 'guruId' (the attendee)
	const targetGuruForClasses = isSubstitute ? watchedGuruAsliId : watchedGuruId;

	// 2. Fetch Data Kelas owned by the target guru
	const { dataKelasAktif: listKelas, isLoadingKelasAktif: isLoadingKelas } =
		useKelas({
			filterCabang: activeCabangId,
			enableQueryGetKelasAktif: true,
			// We need a way to filter by Guru?
			// `useKelas` might not support filtering by specific Guru ID built-in?
			// Let's check `useKelas` hook or we might need to filter client-side if API returns all active classes.
			// Assuming we fetch all and filter client side given the hook definition in previous files likely didn't have guruId filter.
			// Ideally we should add guruId filter to the hook/API, but for now filtering client side if the list is not huge.
			// OR we use a different hook? `useKelas` usually fetches by branch.
		});

	// Filter classes client-side for now
	const filteredKelas = useMemo(() => {
		if (!listKelas || !targetGuruForClasses) return [];

		// Logic to find classes where the guru is assigned
		// Each kelas has `historyGuruKelases`. We need to check if targetGuru is ACTIVE there.
		return listKelas.filter((k) =>
			k.historyGuruKelases.some(
				(h) => h.guruId === targetGuruForClasses && h.statusGuru === "ACTIVE",
			),
		);
	}, [listKelas, targetGuruForClasses]);

	const kelasOptions =
		filteredKelas.map((k) => ({
			label: `${k.kodeKelas} - ${k.jenisKelasRel?.nama ?? "-"} (${k.grup ?? "No Group"})`,
			value: k.id,
		})) ?? [];

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			{/* Toggle Substitute */}
			<FormField
				control={form.control}
				name="isSubstitute"
				render={({ field }) => (
					<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
						<div className="space-y-0.5">
							<FormLabel>Guru Pengganti?</FormLabel>
							<FormDescription>
								Aktifkan jika Anda mengabsenkan diri untuk menggantikan guru
								lain.
							</FormDescription>
						</div>
						<FormControl>
							<Switch
								checked={field.value}
								onCheckedChange={(val) => {
									field.onChange(val);
									// Reset related fields
									form.setValue("guruAsliId", undefined);
									form.setValue("kelasId", "");
								}}
							/>
						</FormControl>
					</FormItem>
				)}
			/>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* Field: Guru ID (Attendee) */}
				<FormField
					control={form.control}
					name="guruId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Guru Yang Hadir (Absen)</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
								value={field.value}
								disabled={!!defaultGuruId} // If default is provided (from detail page), lock it?
							>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Pilih guru..." />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{guruOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Field: Guru Asli (If Substitute) */}
				{isSubstitute && (
					<FormField
						control={form.control}
						name="guruAsliId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Guru Yang Digantikan</FormLabel>
								<Select
									onValueChange={(val) => {
										field.onChange(val);
										form.setValue("kelasId", ""); // Reset class when guru changes
									}}
									defaultValue={field.value}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih guru asli..." />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{guruOptions
											.filter((g) => g.value !== watchedGuruId) // Exclude self
											.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
			</div>

			{/* Field: Kelas */}
			<FormField
				control={form.control}
				name="kelasId"
				render={({ field }) => (
					<FormItem className="flex flex-col">
						<FormLabel>Pilih Kelas</FormLabel>
						<Popover>
							<PopoverTrigger asChild>
								<FormControl>
									<Button
										variant="outline"
										role="combobox"
										disabled={isLoadingKelas || !targetGuruForClasses}
										className={cn(
											"w-full justify-between",
											!field.value && "text-muted-foreground",
										)}
									>
										{field.value
											? kelasOptions.find((k) => k.value === field.value)?.label
											: !targetGuruForClasses
												? "Pilih guru terlebih dahulu"
												: isLoadingKelas
													? "Memuat data..."
													: "Pilih kelas"}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</FormControl>
							</PopoverTrigger>
							<PopoverContent className="w-[450px] p-0">
								<Command>
									<CommandInput placeholder="Cari kelas..." />
									<CommandList>
										<CommandEmpty>
											{filteredKelas.length === 0
												? "Tidak ada kelas aktif untuk guru ini."
												: "Tidak ditemukan."}
										</CommandEmpty>
										<CommandGroup>
											<ScrollArea className="h-48">
												{kelasOptions.map((option) => (
													<CommandItem
														value={option.label}
														key={option.value}
														onSelect={() => {
															form.setValue("kelasId", option.value);
														}}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																option.value === field.value
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
														{option.label}
													</CommandItem>
												))}
											</ScrollArea>
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Date & Time Picker */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="tanggalWaktu"
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>Tanggal Pertemuan</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant={"outline"}
											className={cn(
												"w-full pl-3 text-left font-normal",
												!field.value && "text-muted-foreground",
											)}
										>
											{field.value ? (
												format(field.value, "PPP")
											) : (
												<span>Pilih tanggal</span>
											)}
											<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value}
										onSelect={field.onChange}
										disabled={(date) =>
											date > new Date() || date < new Date("1900-01-01")
										}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="time"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Jam Pertemuan</FormLabel>
							<FormControl>
								<Input
									type="time"
									{...field}
									className="block"
									onChange={(e) => {
										field.onChange(e.target.value);
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Status Kehadiran</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Pilih status" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(StatusAbsenGuru).map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isVerified"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto h-10">
							<div className="space-y-0.5">
								<FormLabel>Langsung Verifikasi?</FormLabel>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
			</div>
		</form>
	);
}
