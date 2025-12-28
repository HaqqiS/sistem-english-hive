"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
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
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { useMurid } from "@/hooks/useMurid"; // Hook baru untuk search murid
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import type { TypeClientCreatePembayaranSchema } from "@/types/pembayaran.type";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { toRupiah } from "@/utils/toRupiah";

interface PembayaranFormProps {
	onSubmit: (data: TypeClientCreatePembayaranSchema) => void;
}

export default function PembayaranForm({ onSubmit }: PembayaranFormProps) {
	const { activeCabangId } = useGlobalCabangStore();
	const form = useFormContext<TypeClientCreatePembayaranSchema>();
	const { setValue, watch } = form;

	// 1. STATE UNTUK SEARCH MURID
	const [openCombobox, setOpenCombobox] = useState(false);
	const [searchMurid, setSearchMurid] = useState("");
	const debouncedSearchMurid = useDebounce(searchMurid, 500);
	const [selectedMurid, setSelectedMurid] = useState<{
		id: string;
		nama: string;
	} | null>(null);

	// Get Data Murid (Searchable)
	const { dataAllMuridPaginated, isLoadingAllMuridPaginated } = useMurid({
		pagination: { pageIndex: 0, pageSize: 50 },
		searchFilterAll: debouncedSearchMurid,
		filterCabang: activeCabangId,
		filterStatusAll: "AKTIF", // Hanya murid aktif
	});

	// 2. STATE UNTUK PILIH KELAS (Available Enrollments)
	// Kita butuh pendaftaranKelasId yang dipilih user
	const watchPendaftaranKelasId = watch("pendaftaranKelasId");

	const { dataActivePendaftaranByMurid, isLoadingActivePendaftaranByMurid } =
		usePendaftaranKelas({
			muridId: selectedMurid?.id,
			// enableQuery: !!selectedMurid?.id, // Logic handled inside hook via 'enabled' options logic if updated, or manual skipToken
		});

	// 3. EFFECT: Auto-fill Harga saat Kelas dipilih
	useEffect(() => {
		if (watchPendaftaranKelasId && dataActivePendaftaranByMurid) {
			const targetPendaftaran = dataActivePendaftaranByMurid.find(
				(p) => p.id === watchPendaftaranKelasId,
			);

			if (targetPendaftaran) {
				setValue("jumlahBayar", targetPendaftaran.Kelas.hargaKelas);
			}
		}
	}, [watchPendaftaranKelasId, dataActivePendaftaranByMurid, setValue]);

	// 4. EFFECT: Auto-set Tanggal ke Hari Ini jika kosong
	useEffect(() => {
		if (!form.getValues("tanggalBayar")) {
			setValue("tanggalBayar", formatDateToYYYYMMDD(new Date()));
		}
	}, [setValue, form]);

	// 5. EFFECT: Reset form jika Murid berubah
	useEffect(() => {
		if (!selectedMurid) {
			setValue("pendaftaranKelasId", "");
			setValue("jumlahBayar", 0);
		}
	}, [selectedMurid, setValue]);

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			{/* --- LANGKAH 1: PILIH MURID --- */}
			<div className="space-y-2">
				<FormLabel>Pilih Siswa</FormLabel>
				<Popover open={openCombobox} onOpenChange={setOpenCombobox}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={openCombobox}
							className="w-full justify-between"
						>
							{selectedMurid ? selectedMurid.nama : "Cari nama siswa..."}
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-full min-w-md p-0" align="center">
						<Command shouldFilter={false}>
							<CommandInput
								placeholder="Ketik nama siswa..."
								value={searchMurid}
								onValueChange={setSearchMurid}
							/>
							<CommandList className="max-h-[300px] overflow-y-auto">
								{isLoadingAllMuridPaginated && (
									<div className="py-6 text-center text-sm">
										Mencari siswa...
									</div>
								)}
								{!isLoadingAllMuridPaginated &&
									dataAllMuridPaginated.length === 0 && (
										<CommandEmpty>Siswa tidak ditemukan.</CommandEmpty>
									)}
								{dataAllMuridPaginated.map((murid) => (
									<CommandItem
										key={murid.id}
										value={murid.id}
										onSelect={() => {
											setSelectedMurid({
												id: murid.id,
												nama: murid.namaLengkap,
											});
											setOpenCombobox(false);
											setValue("pendaftaranKelasId", ""); // Reset kelas
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												selectedMurid?.id === murid.id
													? "opacity-100"
													: "opacity-0",
											)}
										/>
										<div className="flex flex-col">
											<span>{murid.namaLengkap}</span>
											<span className="text-muted-foreground text-xs">
												{murid.umur} Tahun - {murid.kelasSekolah}
											</span>
										</div>
									</CommandItem>
								))}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{!selectedMurid && (
					<div className="text-muted-foreground text-[0.8rem]">
						Wajib memilih siswa terlebih dahulu.
					</div>
				)}
			</div>

			{/* --- LANGKAH 2: PILIH KELAS (Enrollment) --- */}
			<FormField
				control={form.control}
				name="pendaftaranKelasId"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Pilih Kelas (Enrollment)</FormLabel>
						<FormControl>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								disabled={!selectedMurid || isLoadingActivePendaftaranByMurid}
							>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={
											!selectedMurid
												? "Pilih siswa di atas dahulu..."
												: isLoadingActivePendaftaranByMurid
													? "Memuat kelas..."
													: "Pilih Kelas Siswa"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{!dataActivePendaftaranByMurid ||
									dataActivePendaftaranByMurid.length === 0 ? (
										<div className="text-muted-foreground p-2 text-center text-sm">
											Siswa ini belum terdaftar di kelas manapun (Aktif/Trial).
										</div>
									) : (
										dataActivePendaftaranByMurid.map((pendaftaran) => (
											<SelectItem key={pendaftaran.id} value={pendaftaran.id}>
												{pendaftaran.Kelas.kodeKelas} —{" "}
												{toRupiah(pendaftaran.Kelas.hargaKelas)}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* --- FORM FIELD: JUMLAH BAYAR --- */}
			<FormField
				control={form.control}
				name="jumlahBayar"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Jumlah Bayar</FormLabel>
						<FormControl>
							<Input
								placeholder="Rp 0"
								{...field}
								type="text"
								value={
									field.value !== undefined && field.value !== null
										? toRupiah(Number(field.value))
										: ""
								}
								onChange={(e) => {
									const rawValue = e.target.value.replace(/[^0-9]/g, "");
									const numericValue = rawValue ? parseInt(rawValue, 10) : 0;
									field.onChange(numericValue);
								}}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* --- FORM FIELD: TANGGAL BAYAR --- */}
			<FormStringDatePicker
				control={form.control}
				name="tanggalBayar"
				label="Tanggal Pembayaran"
				placeholder="Pilih tanggal"
			/>

			{/* --- FORM FIELD: NOTE --- */}
			<FormField
				control={form.control}
				name="note"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Catatan (Opsional)</FormLabel>
						<FormControl>
							<Textarea
								placeholder="Contoh: Pembayaran Cash di kantor"
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
