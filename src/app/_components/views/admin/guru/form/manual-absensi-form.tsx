"use client";

import { StatusAbsenGuru } from "@prisma/client";
import { format } from "date-fns";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
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
import { api } from "@/trpc/react";
import type { TypeClientCreateManualAbsensiSchema } from "@/types/absenGuru.type";

interface ManualAbsensiFormProps {
	onSubmit: (values: TypeClientCreateManualAbsensiSchema) => void;
}

export default function ManualAbsensiForm({
	onSubmit,
}: ManualAbsensiFormProps) {
	const { activeCabangId } = useGlobalCabangStore();

	// Use Form Context
	const form = useFormContext<TypeClientCreateManualAbsensiSchema>();

	const watchedKelasId = form.watch("kelasId");

	// 1. Fetch Data Guru
	const { dataComplete: listGuru, isLoadingComplete: isLoadingGuru } = useUser({
		filterCabang: activeCabangId,
		enableQuery: true,
	});

	const guruOptions =
		listGuru?.map((g) => ({
			label: g.name ?? "Tanpa Nama",
			value: g.id,
		})) ?? [];

	// 2. Fetch Data Kelas
	const { dataKelasAktif: listKelas, isLoadingKelasAktif: isLoadingKelas } =
		useKelas({
			filterCabang: activeCabangId,
			enableQueryGetKelasAktif: true,
		});

	const kelasOptions =
		listKelas?.map((k) => ({
			label: `${k.kodeKelas} - ${k.jenisKelasRel?.nama ?? "-"}`,
			value: k.id,
		})) ?? [];

	// 3. Fetch Sesi Tanpa Guru (Dependent on Kelas)
	const { data: listSesi, isLoading: isLoadingSesi } =
		api.absenGuru.getSesiTanpaGuru.useQuery(
			{
				kelasId: watchedKelasId,
				cabangId: activeCabangId,
			},
			{
				enabled: !!watchedKelasId,
			},
		);

	const sesiOptions = useMemo(() => {
		return (
			listSesi?.map((s) => {
				const dateStr = format(new Date(s.tanggalWaktu), "dd MMM yyyy");
				const hari = s.jadwalKelas?.hari
					? s.jadwalKelas.hari.charAt(0) +
						s.jadwalKelas.hari.slice(1).toLowerCase()
					: "";
				const jamStr = s.jadwalKelas?.jamSlotTetap
					? `${s.jadwalKelas.jamSlotTetap.jamMulai}-${s.jadwalKelas.jamSlotTetap.jamSelesai}`
					: format(new Date(s.tanggalWaktu), "HH:mm");

				return {
					label: `${hari ? `${hari}, ` : ""}${dateStr} • ${jamStr} (${s.ruang.namaRuang})`,
					value: s.id,
				};
			}) ?? []
		);
	}, [listSesi]);

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			<FormField
				control={form.control}
				name="guruId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Pilih Guru</FormLabel>
						<Select
							onValueChange={field.onChange}
							defaultValue={field.value}
							disabled={isLoadingGuru}
						>
							<FormControl>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={
											isLoadingGuru ? "Memuat data..." : "Pilih guru"
										}
									/>
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
										disabled={isLoadingKelas}
										className={cn(
											"w-full justify-between",
											!field.value && "text-muted-foreground",
										)}
									>
										{field.value
											? kelasOptions.find((k) => k.value === field.value)?.label
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
										<CommandEmpty>Tidak ditemukan.</CommandEmpty>
										<CommandGroup>
											<ScrollArea className="h-48">
												{kelasOptions.map((option) => (
													<CommandItem
														value={option.label}
														key={option.value}
														onSelect={() => {
															form.setValue("kelasId", option.value);
															form.setValue("sesiPertemuanKelasId", ""); // Reset Sesi
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

			<FormField
				control={form.control}
				name="sesiPertemuanKelasId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							Pilih Sesi Pertemuan{" "}
							<span className="text-muted-foreground text-xs font-normal">
								(yang belum ada pengajar)
							</span>
						</FormLabel>
						<Select
							onValueChange={field.onChange}
							defaultValue={field.value}
							disabled={
								!watchedKelasId || isLoadingSesi || sesiOptions.length === 0
							}
						>
							<FormControl>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={
											!watchedKelasId
												? "Pilih kelas dahulu"
												: isLoadingSesi
													? "Memuat sesi..."
													: sesiOptions.length === 0
														? "Tidak ada sesi tersedia"
														: "Pilih sesi"
										}
									/>
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{sesiOptions.map((option) => (
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

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Status Kehadiran</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
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
