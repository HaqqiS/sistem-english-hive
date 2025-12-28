"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type KategoriTagihan, StatusPembayaran } from "@prisma/client";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Form,
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
import { useMurid } from "@/hooks/useMurid";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { useTagihanLain } from "@/hooks/useTagihanLain";
import { cn } from "@/lib/utils";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import {
	type CreateTagihanLainInput,
	createTagihanLainSchema,
} from "@/types/tagihanLain.type";
import { toRupiah } from "@/utils/toRupiah";

interface TambahTagihanLainProps {
	kategori: KategoriTagihan;
	label: string; // e.g., "Tambah Buku" or "Tambah Fee"
}

export default function TambahTagihanLain({
	kategori,
	label,
}: TambahTagihanLainProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { activeCabangId } = useGlobalCabangStore();

	const form = useForm({
		resolver: zodResolver(createTagihanLainSchema),
		defaultValues: {
			kategori: kategori,
			muridId: "",
			kelasId: "",
			judul: "",
			jumlah: 0,
			deskripsi: "",
			status: StatusPembayaran.BELUM_LUNAS,
		},
	});
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
		pagination: { pageIndex: 0, pageSize: 10 },
		searchFilterAll: debouncedSearchMurid,
		filterCabang: activeCabangId,
		filterStatusAll: "AKTIF",
	});

	// 2. STATE UNTUK PILIH KELAS (Available Enrollments)
	// Kita butuh pendaftaranKelasId yang dipilih user
	const watchKelasId = watch("kelasId");

	const { dataActivePendaftaranByMurid, isLoadingActivePendaftaranByMurid } =
		usePendaftaranKelas({
			muridId: selectedMurid?.id,
		});

	// 3. EFFECT: Auto-fill Harga Buku saat Kelas dipilih (Hanya jika Kategori BUKU)
	useEffect(() => {
		if (kategori === "BUKU" && watchKelasId && dataActivePendaftaranByMurid) {
			const targetPendaftaran = dataActivePendaftaranByMurid.find(
				(p) => p.kelasId === watchKelasId,
			);

			if (targetPendaftaran) {
				// Ambil harga buku dari jenisKelasRel
				const hargaBuku = targetPendaftaran.Kelas.jenisKelasRel?.hargaBuku ?? 0;
				if (hargaBuku > 0) {
					setValue("jumlah", hargaBuku);
					// Opsional: Auto-fill Judul
					if (!form.getValues("judul")) {
						setValue("judul", `Buku ${targetPendaftaran.Kelas.kodeKelas}`);
					}
				}
			}
		}
	}, [watchKelasId, dataActivePendaftaranByMurid, setValue, kategori, form]);

	// Mutasi
	const { mutations } = useTagihanLain({
		onSuccessCreate: () => {
			form.reset({
				kategori: kategori,
				muridId: "",
				kelasId: "",
				judul: "",
				jumlah: 0,
				deskripsi: "",
				status: StatusPembayaran.BELUM_LUNAS,
			});
			setSelectedMurid(null);
			setIsOpen(false);
		},
	});

	const onSubmit = (values: CreateTagihanLainInput) => {
		// Ensure kategori is consistent with prop
		const payload = { ...values, kategori: kategori };
		// Jika REGISTRASI, pastikan kelasId undefined agar bersih (opsional)
		if (kategori === "REGISTRASI") {
			delete payload.kelasId;
		}
		mutations.create.mutate(payload);
	};

	return (
		<AddDrawer
			title={`Buat Tagihan ${kategori === "BUKU" ? "Buku" : kategori === "REGISTRASI" ? "Registrasi" : "Lainnya"}`}
			description={`Buat tagihan baru kategori ${kategori}.`}
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.create.isPending}
			submitText="Simpan Tagihan"
			cancelText="Batal"
			trigger={
				<Button size="sm">
					<Plus className="mr-2 h-4 w-4" />
					{label}
				</Button>
			}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<Form {...form}>
				<form className="space-y-4">
					{/* --- LANGKAH 1: PILIH MURID --- */}
					<div className="space-y-2">
						<FormLabel>Pilih Murid</FormLabel>
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
									<CommandList>
										{isLoadingAllMuridPaginated && (
											<div className="py-6 text-center text-sm">
												Mencari murid...
											</div>
										)}
										{!isLoadingAllMuridPaginated &&
											dataAllMuridPaginated.length === 0 && (
												<CommandEmpty>Murid tidak ditemukan.</CommandEmpty>
											)}
										{dataAllMuridPaginated.map((murid) => (
											<CommandItem
												key={murid.id}
												value={murid.namaLengkap}
												onSelect={() => {
													setSelectedMurid({
														id: murid.id,
														nama: murid.namaLengkap,
													});
													setOpenCombobox(false);
													setValue("muridId", murid.id);
													setValue("kelasId", ""); // Reset kelas
													setValue("jumlah", 0); // Reset jumlah
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
					</div>

					{/* --- PILIH KELAS (HANYA JIKA KATEGORI BUKU) --- */}
					{kategori === "BUKU" && (
						<FormField
							control={form.control}
							name="kelasId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Kelas (Untuk Tagihan Buku)</FormLabel>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={
												!selectedMurid || isLoadingActivePendaftaranByMurid
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue
													placeholder={
														!selectedMurid
															? "Pilih murid dahulu..."
															: isLoadingActivePendaftaranByMurid
																? "Memuat kelas..."
																: "Pilih Kelas"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{!dataActivePendaftaranByMurid ||
												dataActivePendaftaranByMurid.length === 0 ? (
													<div className="text-muted-foreground p-2 text-center text-sm">
														Murid ini tidak memiliki kelas aktif.
													</div>
												) : (
													dataActivePendaftaranByMurid.map((p) => {
														const hargaBuku =
															p.Kelas.jenisKelasRel?.hargaBuku ?? 0;
														return (
															<SelectItem key={p.kelasId} value={p.kelasId}>
																{p.Kelas.kodeKelas} (Buku: {toRupiah(hargaBuku)}
																)
															</SelectItem>
														);
													})
												)}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					{/* --- JUDUL --- */}
					<FormField
						control={form.control}
						name="judul"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Keterangan</FormLabel>
								<FormControl>
									<Input
										placeholder="Contoh: Registrasi Murid/Buku Level 1"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* --- JUMLAH --- */}
					<FormField
						control={form.control}
						name="jumlah"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Jumlah (Rp)</FormLabel>
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
											const numericValue = rawValue
												? parseInt(rawValue, 10)
												: 0;
											field.onChange(numericValue);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* --- DESKRIPSI (OPTIONAL) --- */}
					<FormField
						control={form.control}
						name="deskripsi"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Deskripsi (Opsional)</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Keterangan tambahan..."
										className="resize-none"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</AddDrawer>
	);
}
