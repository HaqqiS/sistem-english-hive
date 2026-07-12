"use client";

import { Gender, StatusMurid } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { cn } from "@/lib/utils"; // Import cn for cleaner class merging
import { UserRole } from "@/server/auth/type";
import type { TypeClientRegisterMuridSchema } from "@/types/murid.type";

interface MuridFormProps {
	onSubmit: (data: TypeClientRegisterMuridSchema) => void;
	idPrefix?: string;
	forceStacked?: boolean; // New prop to force 1 column layout
	isEditMode?: boolean; // New prop to indicate edit mode
	isPending?: boolean; // [NEW] Loading state for submit button
}

const formTranslations = {
	id: {
		langsungDaftar: "Langsung Daftar?",
		pilihOpsi: "Pilih opsi",
		daftarLangsung: "Daftar Langsung",
		trial: "Trial",
		namaLengkap: "Nama Lengkap",
		masukkanNama: "Masukkan nama lengkap",
		jenisKelamin: "Jenis Kelamin",
		pilihGender: "Pilih jenis kelamin",
		lakiLaki: "Laki-laki",
		perempuan: "Perempuan",
		umur: "Umur",
		noWA: "No. WA",
		instagram: "Instagram",
		pilihanProgram: "Pilihan Program",
		pilihProgram: "Pilih program",
		reguler: "Reguler",
		regulerSekolah: "Reguler Sekolah (5-12 Siswa)",
		privat: "Privat",
		privatSekolah: "Privat Sekolah (1 Siswa 1 Tutor)",
		privatDewasa: "Privat Dewasa/Kerja (1 Siswa 1 Tutor)",
		pilihCabang: "Pilih Cabang",
		loading: "Loading...",
		asalSekolah: "Asal Sekolah",
		masukkanAsal: "Masukkan asal sekolah",
		kelasSekolah: "Kelas Sekolah",
		kelasSaatIni: "Kelas saat ini",
		sumberInfo: "Sumber Informasi",
		teman: "Teman",
		lainnya: "Lainnya",
		masukkanSumber: "Masukkan sumber informasi lain...",
		catatanAdmin: "Catatan Admin (Internal)",
		masukkanCatatan: "Catatan khusus mengenai murid ini...",
		biayaPendaftaran: "Biaya Pendaftaran & Buku",
		deskripsiBiaya:
			"Tagihan biaya pendaftaran dan buku kini dikelola manual per kelas di halaman Pembayaran Kelas, tidak lagi dibuat otomatis di sini.",
		kirim: "Kirim Pendaftaran",
		mengirim: "Mengirim...",
	},
	en: {
		langsungDaftar: "Direct Registration?",
		pilihOpsi: "Choose option",
		daftarLangsung: "Direct Register",
		trial: "Trial",
		namaLengkap: "Full Name",
		masukkanNama: "Enter full name",
		jenisKelamin: "Gender",
		pilihGender: "Choose gender",
		lakiLaki: "Male",
		perempuan: "Female",
		umur: "Age",
		noWA: "WA Number",
		instagram: "Instagram",
		pilihanProgram: "Program Selection",
		pilihProgram: "Choose program",
		reguler: "Regular",
		regulerSekolah: "Regular School (5-12 Students)",
		privat: "Private",
		privatSekolah: "Private School (1 Student 1 Tutor)",
		privatDewasa: "Private Adult/Work (1 Student 1 Tutor)",
		pilihCabang: "Choose Branch",
		loading: "Loading...",
		asalSekolah: "School Name",
		masukkanAsal: "Enter school name",
		kelasSekolah: "School Grade",
		kelasSaatIni: "Current grade",
		sumberInfo: "Information Source",
		teman: "Friend",
		lainnya: "Other",
		masukkanSumber: "Enter other information source...",
		catatanAdmin: "Admin Notes (Internal)",
		masukkanCatatan: "Specific notes for this student...",
		biayaPendaftaran: "Registration & Book Fee",
		deskripsiBiaya:
			"Registration and book bills are now managed manually per class on the Class Payment page, no longer created automatically here.",
		kirim: "Submit Registration",
		mengirim: "Submitting...",
	},
};

export default function MuridForm({
	onSubmit,
	idPrefix = "murid",
	forceStacked = false, // Default false (Responsive)
	isEditMode = false, // Default false (Create mode)
	isPending = false, // [NEW]
}: MuridFormProps) {
	const form = useFormContext<TypeClientRegisterMuridSchema>();
	const session = useSession();
	const isAuthorized =
		session.data?.user?.role === UserRole.ADMIN ||
		session.data?.user?.role === UserRole.MANAGER;
	const isAdmin = session.data?.user?.role === UserRole.ADMIN;
	const { dataList: dataCabang, isLoading: isLoadingCabang } = useCabang({
		enableQuery: false,
		enableQueryList: true,
	});

	const [lang, setLang] = useState<"id" | "en">("id");
	const t = formTranslations[lang];

	const [isOther, setIsOther] = useState(
		form.getValues("sumberInfo") === "Other" ||
			(form.getValues("sumberInfo") &&
				!["Instagram", "WhatsApp", "Teman"].includes(
					form.getValues("sumberInfo"),
				)),
	);
	const [otherValue, setOtherValue] = useState("");

	// Define grid class based on props
	// If forceStacked is true: always 1 column
	// If false: 1 column on mobile, 2 columns on medium screens and up
	const gridColsClass = forceStacked
		? "grid-cols-1"
		: "grid-cols-1 md:grid-cols-2";

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			{/* Language Switcher */}
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant={lang === "id" ? "default" : "outline"}
					size="xs"
					onClick={() => setLang("id")}
					className="h-7 px-3 text-[10px]"
				>
					ID
				</Button>
				<Button
					type="button"
					variant={lang === "en" ? "default" : "outline"}
					size="xs"
					onClick={() => setLang("en")}
					className="h-7 px-3 text-[10px]"
				>
					EN
				</Button>
			</div>

			{/* Container utama: 2 kolom di desktop untuk layout form besar, 1 kolom jika forceStacked */}
			<div className={cn("grid gap-4", gridColsClass)}>
				<div className="col-span-1 space-y-4">
					{!isEditMode && (
						<FormField
							control={form.control}
							name="statusMurid"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm">
										<span>{t.langsungDaftar}</span>
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder={<span>{t.pilihOpsi}</span>} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={StatusMurid.PENDAFTAR_BARU}>
												<span>{t.daftarLangsung}</span>
											</SelectItem>
											<SelectItem value={StatusMurid.TRIAL}>
												<span>{t.trial}</span>
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					<FormField
						control={form.control}
						name="namaLengkap"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">
									<span>{t.namaLengkap}</span>
								</FormLabel>
								<FormControl>
									<Input placeholder={t.masukkanNama} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Email removed */}

					{/* Alamat removed */}

					<FormField
						control={form.control}
						name="gender"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">
									<span>{t.jenisKelamin}</span>
								</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder={<span>{t.pilihGender}</span>} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={Gender.LAKI_LAKI}>
											<span>{t.lakiLaki}</span>
										</SelectItem>
										<SelectItem value={Gender.PEREMPUAN}>
											<span>{t.perempuan}</span>
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Inner Grid: Umur & WA & Instagram */}
					<div className={cn("grid gap-2", gridColsClass)}>
						<FormField
							control={form.control}
							name="umur"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm">
										<span>{t.umur}</span>
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder={t.umur}
											{...field}
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.valueAsNumber)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="noWA"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm">
										<span>{t.noWA}</span>
									</FormLabel>
									<FormControl>
										<Input type="tel" placeholder="08..." {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="instagram"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm">
										<span>{t.instagram}</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="@username"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Inner Grid: Program & Cabang */}
					<div className={cn("grid gap-2", gridColsClass)}>
						<FormField
							control={form.control}
							name="pilihanProgram"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm">
										<span>{t.pilihanProgram}</span>
									</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue
													placeholder={<span>{t.pilihProgram}</span>}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>
													<span>{t.reguler}</span>
												</SelectLabel>
												<SelectItem value="regulerSekolah">
													<span>{t.regulerSekolah}</span>
												</SelectItem>
											</SelectGroup>
											<SelectGroup>
												<SelectLabel>
													<span>{t.privat}</span>
												</SelectLabel>
												<SelectItem value="privatSekolah">
													<span>{t.privatSekolah}</span>
												</SelectItem>
												<SelectItem value="privatDewasa">
													<span>{t.privatDewasa}</span>
												</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{!isAdmin && (
							<FormField
								control={form.control}
								name="cabangId"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-sm">
											<span>{t.pilihCabang}</span>
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={isLoadingCabang}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue
														placeholder={
															<span>
																{isLoadingCabang ? t.loading : t.pilihCabang}
															</span>
														}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{dataCabang?.map((items) => (
													<SelectItem key={items.id} value={items.id}>
														<span>{items.namaCabang}</span>
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
				</div>

				<div className="col-span-1 space-y-4">
					<FormField
						control={form.control}
						name="asalSekolah"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">
									<span>{t.asalSekolah}</span>
								</FormLabel>
								<FormControl>
									<Input type="text" placeholder={t.masukkanAsal} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="kelasSekolah"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">
									<span>{t.kelasSekolah}</span>
								</FormLabel>
								<FormControl>
									<Input type="text" placeholder={t.kelasSaatIni} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Jam Pulang removed */}

					<FormField
						control={form.control}
						name="sumberInfo"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">
									<span>{t.sumberInfo}</span>
								</FormLabel>
								<FormControl>
									<div className="space-y-2">
										<RadioGroup
											value={isOther ? "Other" : field.value}
											onValueChange={(value) => {
												if (value === "Other") {
													setIsOther(true);
													field.onChange(otherValue);
												} else {
													setIsOther(false);
													field.onChange(value);
												}
											}}
										>
											<div className="flex items-center gap-3">
												<RadioGroupItem
													value="Instagram"
													id={`${idPrefix}-r1`}
												/>
												<Label htmlFor={`${idPrefix}-r1`}>Instagram</Label>
											</div>
											<div className="flex items-center gap-3">
												<RadioGroupItem
													value="WhatsApp"
													id={`${idPrefix}-r2`}
												/>
												<Label htmlFor={`${idPrefix}-r2`}>WhatsApp</Label>
											</div>
											<div className="flex items-center gap-3">
												<RadioGroupItem value="Teman" id={`${idPrefix}-r3`} />
												<Label htmlFor={`${idPrefix}-r3`}>
													<span>{t.teman}</span>
												</Label>
											</div>
											<div className="flex items-center gap-3">
												<RadioGroupItem value="Other" id={`${idPrefix}-r4`} />
												<Label htmlFor={`${idPrefix}-r4`}>
													<span>{t.lainnya}</span>
												</Label>
											</div>
										</RadioGroup>

										{isOther && (
											<Input
												placeholder={t.masukkanSumber}
												value={otherValue}
												onChange={(e) => {
													const val = e.target.value;
													setOtherValue(val);
													field.onChange(val);
												}}
												className="mt-2"
											/>
										)}
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{isAuthorized && (
						<>
							<FormField
								control={form.control}
								name="deskripsi"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-sm">
											<span>{t.catatanAdmin}</span>
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t.masukkanCatatan}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{!isEditMode && (
								<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
									<p className="font-medium text-foreground">
										{t.biayaPendaftaran}
									</p>
									<p className="mt-1">{t.deskripsiBiaya}</p>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			<div className="mt-4">
				<Button type="submit" size="sm" className="w-full" disabled={isPending}>
					<span>{isPending ? t.mengirim : t.kirim}</span>
				</Button>
			</div>
		</form>
	);
}
