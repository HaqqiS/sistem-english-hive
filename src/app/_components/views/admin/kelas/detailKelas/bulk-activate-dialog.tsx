"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { StatusPendaftaran } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormStringDatePicker } from "@/app/_components/shared/FormStringDatePicker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";

interface BulkActivateDialogProps {
	selectedIds: string[];
	onSuccess: () => void;
	trigger?: React.ReactNode;
}

// Skema untuk form dialog (subset dari bulk schema, karena pendaftaranIds di-pass hidden/state)
const formSchema = z.object({
	tanggalMulai: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
});

export function BulkActivateDialog({
	selectedIds,
	onSuccess,
	trigger,
}: BulkActivateDialogProps) {
	const [open, setOpen] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			tanggalMulai: "",
		},
	});

	const { mutations } = usePendaftaranKelas({
		onSuccessUpdate: () => {
			setOpen(false);
			form.reset();
			onSuccess();
			toast.success(`${selectedIds.length} siswa berhasil diaktifkan.`);
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		await mutations.updateBulk.mutateAsync({
			pendaftaranIds: selectedIds,
			status: StatusPendaftaran.AKTIF,
			tanggalMulai: values.tanggalMulai,
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? <Button variant="default">Aktifkan Masal</Button>}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Aktifkan {selectedIds.length} Siswa</DialogTitle>
					<DialogDescription>
						Anda akan mengubah status {selectedIds.length} siswa terpilih
						menjadi AKTIF. Masukkan tanggal mulai efektif.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormStringDatePicker
							control={form.control}
							name="tanggalMulai"
							label="Tanggal Mulai"
						/>

						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline" type="button">
									Batal
								</Button>
							</DialogClose>
							<Button type="submit" disabled={mutations.updateBulk.isPending}>
								{mutations.updateBulk.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Aktifkan
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
