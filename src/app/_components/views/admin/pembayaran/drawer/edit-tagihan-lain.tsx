"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import { useTagihanLain } from "@/hooks/useTagihanLain";
import {
	type UpdateTagihanLainInput,
	updateTagihanLainSchema,
} from "@/types/tagihanLain.type";
import { toRupiah } from "@/utils/toRupiah";
import type { TypeTagihanLain } from "../columns/columns-tagihan-lain";

interface EditTagihanLainProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	data: TypeTagihanLain | null;
}

export default function EditTagihanLain({
	isOpen,
	onOpenChange,
	data,
}: EditTagihanLainProps) {
	const isBuku = data?.kategori === "BUKU";
	const isRegistrasi = data?.kategori === "REGISTRASI";

	const form = useForm<UpdateTagihanLainInput>({
		resolver: zodResolver(updateTagihanLainSchema),
		defaultValues: {
			id: "",
			judul: "",
			jumlah: 0,
			deskripsi: "",
			status: "BELUM_LUNAS",
			kelasId: "",
		},
	});

	// Load data when drawer opens
	useEffect(() => {
		if (data && isOpen) {
			form.reset({
				id: data.id,
				judul: data.judul,
				jumlah: data.jumlah,
				deskripsi: data.deskripsi ?? "",
				status: data.status,
				kelasId: data.kelasId ?? "",
			});
		}
	}, [data, isOpen, form]);

	// Fetch available classes if it's a Book bill, to allow changing class
	const { dataActivePendaftaranByMurid, isLoadingActivePendaftaranByMurid } =
		usePendaftaranKelas({
			muridId: data?.muridId,
			// enableQuery: isOpen && isBuku && !!data?.muridId, // Optimization
		});

	const { mutations } = useTagihanLain({
		onSuccessUpdate: () => {
			onOpenChange(false);
			form.reset();
		},
	});

	const onSubmit = (values: UpdateTagihanLainInput) => {
		mutations.update.mutate({
			...values,
			// If not BUKU, ensure we don't accidentally send a classId if user somehow set it (though UI hides it)
			kelasId: isBuku ? values.kelasId : undefined,
		});
	};

	return (
		<EditDrawer
			title={`Edit Tagihan ${isBuku ? "Buku" : isRegistrasi ? "Registrasi" : "Lainnya"}`}
			description="Ubah detail tagihan ini."
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.update.isPending}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...form}>
				<form className="space-y-4">
					{/* --- KELAS (HANYA BUKU) --- */}
					{isBuku && (
						<FormField
							control={form.control}
							name="kelasId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Kelas (Wajib untuk Buku)</FormLabel>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											value={field.value ?? ""}
											disabled={isLoadingActivePendaftaranByMurid}
										>
											<SelectTrigger className="w-full">
												<SelectValue
													placeholder={
														isLoadingActivePendaftaranByMurid
															? "Memuat kelas..."
															: "Pilih Kelas"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{!dataActivePendaftaranByMurid ||
												dataActivePendaftaranByMurid.length === 0 ? (
													<div className="text-muted-foreground p-2 text-center text-sm">
														Tidak ada kelas aktif lain via enrollment.
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
								<FormLabel>Nama/Judul</FormLabel>
								<FormControl>
									<Input {...field} value={field.value ?? ""} />
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
										{...field}
										value={
											field.value !== undefined
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

					{/* --- DESKRIPSI --- */}
					<FormField
						control={form.control}
						name="deskripsi"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Deskripsi (Opsional)</FormLabel>
								<FormControl>
									<Textarea
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
			</Form>
		</EditDrawer>
	);
}
