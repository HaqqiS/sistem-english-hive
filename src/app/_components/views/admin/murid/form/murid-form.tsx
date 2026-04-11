"use client";

import { Gender, StatusMurid } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
		biayaPendaftaran: "Kenakan Biaya Pendaftaran (Rp 50.000)",
		deskripsiBiaya: "Jika dicentang, tagihan pendaftaran akan otomatis dibuat.",
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
		biayaPendaftaran: "Apply Registration Fee (Rp 50,000)",
		deskripsiBiaya: "If checked, a registration bill will be created.",
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
									<FormLabel className="text-sm">{t.langsungDaftar}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder={t.pilihOpsi} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={StatusMurid.PENDAFTAR_BARU}>
												{t.daftarLangsung}
											</SelectItem>
											<SelectItem value={StatusMurid.TRIAL}>
												{t.trial}
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
								<FormLabel className="text-sm">{t.namaLengkap}</FormLabel>
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
								<FormLabel className="text-sm">{t.jenisKelamin}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder={t.pilihGender} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={Gender.LAKI_LAKI}>
											{t.lakiLaki}
										</SelectItem>
										<SelectItem value={Gender.PEREMPUAN}>
											{t.perempuan}
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
									<FormLabel className="text-sm">{t.umur}</FormLabel>
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
									<FormLabel className="text-sm">{t.noWA}</FormLabel>
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
									<FormLabel className="text-sm">{t.instagram}</FormLabel>
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
									<FormLabel className="text-sm">{t.pilihanProgram}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder={t.pilihProgram} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>{t.reguler}</SelectLabel>
												<SelectItem value="regulerSekolah">
													{t.regulerSekolah}
												</SelectItem>
											</SelectGroup>
											<SelectGroup>
												<SelectLabel>{t.privat}</SelectLabel>
												<SelectItem value="privatSekolah">
													{t.privatSekolah}
												</SelectItem>
												<SelectItem value="privatDewasa">
													{t.privatDewasa}
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
										<FormLabel className="text-sm">{t.pilihCabang}</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}
												disabled={isLoadingCabang}
											>
												<SelectTrigger className="w-full">
													<SelectValue
														placeholder={
															isLoadingCabang ? t.loading : t.pilihCabang
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
					</div>
				</div>

				<div className="col-span-1 space-y-4">
					<FormField
						control={form.control}
						name="asalSekolah"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">{t.asalSekolah}</FormLabel>
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
								<FormLabel className="text-sm">{t.kelasSekolah}</FormLabel>
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
								<FormLabel className="text-sm">{t.sumberInfo}</FormLabel>
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
												<Label htmlFor={`${idPrefix}-r3`}>{t.teman}</Label>
											</div>
											<div className="flex items-center gap-3">
												<RadioGroupItem value="Other" id={`${idPrefix}-r4`} />
												<Label htmlFor={`${idPrefix}-r4`}>{t.lainnya}</Label>
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
										<FormLabel className="text-sm">{t.catatanAdmin}</FormLabel>
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
								<FormField
									control={form.control}
									name="withRegistrationFee"
									render={({ field }) => (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
											<div className="space-y-1 leading-none">
												<FormLabel>{t.biayaPendaftaran}</FormLabel>
												<p className="text-muted-foreground text-sm">
													{t.deskripsiBiaya}
												</p>
											</div>
										</FormItem>
									)}
								/>
							)}
						</>
					)}
				</div>
			</div>

			<div className="mt-4">
				<Button type="submit" size="sm" className="w-full" disabled={isPending}>
					{isPending ? t.mengirim : t.kirim}
				</Button>
			</div>
		</form>
	);
}
