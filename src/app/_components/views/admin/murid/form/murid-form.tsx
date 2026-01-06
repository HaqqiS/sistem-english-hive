"use client";

import { Gender, StatusMurid } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
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
}

export default function MuridForm({
	onSubmit,
	idPrefix = "murid",
	forceStacked = false, // Default false (Responsive)
	isEditMode = false, // Default false (Create mode)
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
			{/* Container utama: 2 kolom di desktop untuk layout form besar, 1 kolom jika forceStacked */}
			<div className={cn("grid gap-4", gridColsClass)}>
				<div className="col-span-1 space-y-4">
					{!isEditMode && (
						<FormField
							control={form.control}
							name="statusMurid"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm">Langsung Daftar?</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pilih opsi" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={StatusMurid.PENDAFTAR_BARU}>
												Daftar Langsung
											</SelectItem>
											<SelectItem value={StatusMurid.TRIAL}>Trial</SelectItem>
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
								<FormLabel className="text-sm">Nama Lengkap</FormLabel>
								<FormControl>
									<Input placeholder="Masukkan nama lengkap" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="email@example.com"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="alamat"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">Alamat</FormLabel>
								<FormControl>
									<Input placeholder="Masukkan alamat" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="gender"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">Jenis Kelamin</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Pilih jenis kelamin" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value={Gender.LAKI_LAKI}>
											<span translate="no" className="notranslate">
												Laki-laki
											</span>
										</SelectItem>
										<SelectItem value={Gender.PEREMPUAN}>
											<span translate="no" className="notranslate">
												Perempuan
											</span>
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Inner Grid: Umur & WA */}
					<div className={cn("grid gap-2", gridColsClass)}>
						<FormField
							control={form.control}
							name="umur"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm">Umur</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="Umur"
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
									<FormLabel className="text-sm">No. WA</FormLabel>
									<FormControl>
										<Input type="tel" placeholder="08..." {...field} />
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
									<FormLabel className="text-sm">Pilihan Program</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Pilih program" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>Reguler</SelectLabel>
												<SelectItem value="regulerSekolah">
													<span translate="no" className="notranslate">
														Reguler Sekolah (5-12 Siswa)
													</span>
												</SelectItem>
											</SelectGroup>
											<SelectGroup>
												<SelectLabel>Privat</SelectLabel>
												<SelectItem value="privatSekolah">
													<span translate="no" className="notranslate">
														Privat Sekolah (1 Siswa 1 Tutor)
													</span>
												</SelectItem>
												<SelectItem value="privatDewasa">
													<span translate="no" className="notranslate">
														Privat Dewasa/Kerja (1 Siswa 1 Tutor)
													</span>
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
					</div>
				</div>

				<div className="col-span-1 space-y-4">
					<FormField
						control={form.control}
						name="asalSekolah"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">Asal Sekolah</FormLabel>
								<FormControl>
									<Input
										type="text"
										placeholder="Masukkan asal sekolah"
										{...field}
									/>
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
								<FormLabel className="text-sm">Kelas Sekolah</FormLabel>
								<FormControl>
									<Input type="text" placeholder="Kelas saat ini" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="jamPulang"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">Jam Pulang Sekolah</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Contoh: Senin-Jumat: 13.00"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="sumberInfo"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm">Sumber Informasi</FormLabel>
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
												<Label htmlFor={`${idPrefix}-r3`}>Teman</Label>
											</div>
											<div className="flex items-center gap-3">
												<RadioGroupItem value="Other" id={`${idPrefix}-r4`} />
												<Label htmlFor={`${idPrefix}-r4`}>Other</Label>
											</div>
										</RadioGroup>

										{isOther && (
											<Input
												placeholder="Masukkan sumber informasi lain..."
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
											Catatan Admin (Internal)
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Catatan khusus mengenai murid ini..."
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
												<FormLabel>
													Kenakan Biaya Pendaftaran (Rp 50.000)
												</FormLabel>
												<p className="text-muted-foreground text-sm">
													Jika dicentang, tagihan pendaftaran akan otomatis
													dibuat.
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
		</form>
	);
}
