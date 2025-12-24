"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { StatusPembayaran } from "@prisma/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { api } from "@/trpc/react";
import type { TypeTagihanLain } from "./columns/columns-tagihan-lain";

const editTagihanLainSchema = z.object({
	id: z.string(),
	judul: z.string().min(1, "Judul harus diisi"),
	jumlah: z.coerce.number().min(0, "Jumlah tidak boleh negatif"),
	deskripsi: z.string().optional(),
	status: z.nativeEnum(StatusPembayaran),
});

type EditTagihanLainSchema = z.infer<typeof editTagihanLainSchema>;

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
	// const { toast } = useToast(); -> Removed
	const utils = api.useUtils();

	const form = useForm<EditTagihanLainSchema>({
		resolver: zodResolver(editTagihanLainSchema),
		defaultValues: {
			id: "",
			judul: "",
			jumlah: 0,
			deskripsi: "",
			status: StatusPembayaran.BELUM_LUNAS,
		},
	});

	useEffect(() => {
		if (data && isOpen) {
			form.reset({
				id: data.id,
				judul: data.judul,
				jumlah: data.jumlah,
				deskripsi: data.deskripsi ?? "",
				status: data.status,
			});
		}
	}, [data, isOpen, form]);

	const updateMutation = api.tagihanLain.update.useMutation({
		onSuccess: () => {
			toast.success("Detail tagihan berhasil diperbarui");
			utils.tagihanLain.getAllByMurid.invalidate();
			onOpenChange(false);
		},
		onError: (err) => {
			toast.error(`Gagal: ${err.message}`);
		},
	});

	const onSubmit = (values: EditTagihanLainSchema) => {
		updateMutation.mutate({
			id: values.id,
			judul: values.judul,
			jumlah: values.jumlah,
			deskripsi: values.deskripsi,
			status: values.status,
		});
	};

	return (
		<EditDrawer
			title="Edit Tagihan Lain"
			description="Ubah detail tagihan (judul, nominal, dll)."
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={updateMutation.isPending}
			submitText="Simpan"
			cancelText="Batal"
		>
			<Form {...form}>
				<form className="space-y-4">
					<FormField
						control={form.control}
						name="judul"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Judul Tagihan</FormLabel>
								<FormControl>
									<Input placeholder="Contoh: Buku Paket A" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="jumlah"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nominal (Rp)</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={0}
										placeholder="0"
										{...field}
										onChange={(e) => field.onChange(e.target.valueAsNumber)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Status Pembayaran</FormLabel>
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
										<SelectItem value={StatusPembayaran.BELUM_LUNAS}>
											Belum Lunas
										</SelectItem>
										<SelectItem value={StatusPembayaran.LUNAS}>
											Lunas
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="deskripsi"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Deskripsi / Catatan</FormLabel>
								<FormControl>
									<Textarea placeholder="Opsional..." {...field} />
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
