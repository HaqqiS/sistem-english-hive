"use client";

// import { JenisKelas, TipeKelas } from "@prisma/client";
import { type JenisKelasModel, StatusKelas, TipeKelas } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { Badge } from "@/components/ui/badge";
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
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCabang } from "@/hooks/useCabang";
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { cn } from "@/lib/utils";
import { UserRole } from "@/server/auth/type";
import type { TypeClientKelasSchema } from "@/types/kelas.type";
import { toRupiah } from "@/utils/toRupiah";

interface KelasFormProps {
	onSubmit: (data: TypeClientKelasSchema) => void;
}

const safeVal = (val: string | number | null | undefined) => val ?? "";

const generateKodeKelas = (
	jenisName: string, // Changed from jenis (ID) to Name
	level: number | string,
	grup: string,
	tipe: string,
	bulanTahun: string,
) => {
	// Hanya buat kode jika semua field penting sudah diisi
	if (jenisName && level && grup && tipe && bulanTahun) {
		// e.g., "REGULAR|TinyTods 1-A|03/2025"
		return `${safeVal(tipe)} | ${jenisName.toUpperCase()} ${safeVal(level)}-${safeVal(grup)} | ${safeVal(bulanTahun)}`;
	}
	return ""; // Kembalikan string kosong jika belum lengkap
};

export default function KelasForm({ onSubmit }: KelasFormProps) {
	const session = useSession();
	const isManager = session.data?.user?.role === UserRole.MANAGER;
	const form = useFormContext<TypeClientKelasSchema>();

	const { dataList: dataCabang, isLoading: isLoadingCabang } = useCabang({
		enableQuery: false,
		enableQueryList: true,
	});

	const { data: jenisKelasList } = useJenisKelas();

	const { watch, setValue } = form;

	// 2. Awasi semua field yang relevan
	const watchedFields = watch([
		"jenisKelasId",
		"level",
		"grup",
		"tipe", // Derived, but needed for kode
		"bulanTahunAjar",
	]);

	useEffect(() => {
		// Watched fields
		const [jenisId, level, grup, tipe, bulanTahun] = watchedFields;

		// Find Name from ID
		const selectedJenis = jenisKelasList?.find((j) => j.id === jenisId);
		const jenisName = selectedJenis?.nama || "";

		// Auto-set Tipe and Harga if Jenis Changed (logic might need refinement to avoid overwriting user edits?)
		// Ideally, when user picks Jenis, we set Tipe.
		if (selectedJenis) {
			// We can't easily detect WHICH field changed here without previous value.
			// But valid logic: Tipe is strictly bound to Jenis.
			if (selectedJenis.tipe !== tipe) {
				setValue("tipe", selectedJenis.tipe);
			}
			// For Harga, we only set default if empty? Or always override?
			// User might want to override.
			// Let's set it only if current value is 0 or empty?
			// Or better: Use onChange in Select to trigger this.
		}

		const newKodeKelas = generateKodeKelas(
			jenisName,
			level,
			grup,
			selectedJenis?.tipe ?? tipe ?? "", // Use derived tipe
			bulanTahun,
		);

		setValue("kodeKelas", newKodeKelas, {
			shouldValidate: true,
			shouldDirty: true,
		});
	}, [watchedFields, setValue, jenisKelasList]);

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="jenisKelasId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Jenis Kelas</FormLabel>
							<FormControl>
								<Select
									onValueChange={(val) => {
										field.onChange(val);
										// Trigger updates
										const selected = jenisKelasList?.find((j) => j.id === val);
										if (selected) {
											setValue("tipe", selected.tipe); // derived
											setValue("hargaKelas", selected.harga);
										}
									}}
									value={field.value}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Pilih jenis kelas" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectLabel>Jenis Program Kelas</SelectLabel>
											{jenisKelasList?.map((jenis: JenisKelasModel) => (
												<SelectItem key={jenis.id} value={jenis.id}>
													<div className="flex items-center gap-2">
														{jenis.nama}
														<Badge
															className={cn("text-xs", {
																"bg-teal-500 text-white":
																	jenis.tipe === TipeKelas.REGULAR,
																"bg-violet-500 text-white":
																	jenis.tipe === TipeKelas.PRIVATE,
															})}
														>
															{jenis.tipe}
														</Badge>
													</div>
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
					name="level"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Level </FormLabel>
							<FormControl>
								{/* <Input placeholder="1-8" type="number" {...field} required /> */}
								<Input
									placeholder="1-8"
									type="text" // Gunakan 'text' untuk kontrol penuh
									inputMode="numeric" // Tampilkan keyboard angka di HP
									{...field}
									onChange={(e) => {
										// Hapus semua karakter non-digit
										const numericValue = e.target.value.replace(/[^0-9]/g, "");
										// Kirim nilai yang sudah bersih ke react-hook-form
										field.onChange(numericValue);
									}}
									required
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Tipe is now Derived/Read-only mostly */}
				<FormField
					control={form.control}
					name="tipe"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tipe (Otomatis)</FormLabel>
							<FormControl>
								<Input {...field} disabled readOnly />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="grup"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Grup</FormLabel>
							<FormControl>
								<Input
									placeholder="A"
									type="text"
									{...field}
									onChange={(e) => {
										const cleanedValue = e.target.value
											.toUpperCase() // 1. Ubah ke huruf besar
											.replace(/[^A-Z]/g, "") // 2. Hapus non-huruf
											.slice(0, 2); // 3. Batasi maksimal 2 karakter
										field.onChange(cleanedValue);
									}}
									required
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="bulanTahunAjar"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Bulan dan Tahun Ajar</FormLabel>
						<FormControl>
							<IMaskInput
								mask="00/0000" // '0' = digit. Ini akan jadi "MM/YYYY"
								placeholder="MM/YYYY"
								// 4. Hubungkan ke react-hook-form
								value={field.value ?? ""}
								onAccept={(value: string) => {
									// 'onAccept' adalah cara imask menggantikan 'onChange'
									field.onChange(value);
								}}
								onBlur={field.onBlur}
								inputRef={field.ref} // <-- 5. Jangan lupa pass 'ref'
								required
								className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:outline-none"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{isManager && (
				<FormField
					control={form.control}
					name="cabangId"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-sm">Pilih Cabang</FormLabel>
							<FormControl>
								<Select
									onValueChange={field.onChange}
									value={field.value}
									disabled={isLoadingCabang}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={
												isLoadingCabang ? "Loading..." : "Pilih Cabang"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{dataCabang?.map((items) => (
											<SelectItem key={items.id} value={items.id}>
												{items.namaCabang}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}

			<FormField
				control={form.control}
				name="kodeKelas"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Kode Kelas</FormLabel>
						<FormControl>
							<Input
								placeholder="REGULAR | TinyTods 1-A | 03/2025"
								type="text"
								{...field}
								required
								disabled
								readOnly
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="hargaKelas"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Harga Program Kelas</FormLabel>
						<FormControl>
							<Input
								placeholder="Rp 0"
								{...field}
								type="text" // 1. Ubah ke text agar bisa render "Rp" dan "."
								// 2. Format value saat ditampilkan (display value)
								// Jika nilainya 0 atau ada isinya, format ke Rupiah. Jika undefined/null, string kosong.
								value={
									field.value !== undefined && field.value !== null
										? toRupiah(Number(field.value))
										: ""
								}
								// 3. Handle perubahan input
								onChange={(e) => {
									// Bersihkan semua karakter kecuali angka
									const rawValue = e.target.value.replace(/[^0-9]/g, "");

									// Konversi ke number (handling jika string kosong jadi 0)
									const numericValue = rawValue ? parseInt(rawValue, 10) : 0;

									// Kirim data number murni ke React Hook Form / Zod
									field.onChange(numericValue);
								}}
								required
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="statusKelas"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Status Kelas</FormLabel>
						<FormControl>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								disabled={isLoadingCabang}
							>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={
											isLoadingCabang ? "Loading..." : "Pilih Status Kelas"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{Object.values(StatusKelas).map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="deskripsi"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Deskripsi</FormLabel>
						<FormControl>
							<Textarea
								placeholder="Masukkan deskripsi program kelas"
								{...field}
								required
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</form>
	);
}
