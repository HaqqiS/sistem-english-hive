"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { useJenisKelasStore } from "@/store/useMasterDataStore";
import { jenisKelasSchema, type TypeJenisKelas } from "@/types/jenisKelas.type";
import { JenisKelasForm } from "./jenis-kelas-form";

export function EditJenisKelas() {
	const { isDrawerOpen, selectedJenisKelas, closeDrawer, clearSelected } =
		useJenisKelasStore();
	const isOpen = isDrawerOpen("edit");
	const { mutations } = useJenisKelas();

	const form = useForm<TypeJenisKelas>({
		resolver: zodResolver(jenisKelasSchema),
		defaultValues: {
			nama: "",
			tipe: "REGULAR",
			harga: 0,
			deskripsi: "",
			nextLevelId: null,
		},
	});

	// Update form values when selected item changes
	useEffect(() => {
		if (selectedJenisKelas) {
			form.reset(selectedJenisKelas);
		}
	}, [selectedJenisKelas, form]);

	const onSubmit = async (data: TypeJenisKelas) => {
		if (!selectedJenisKelas?.id) return;
		await mutations.update.mutateAsync(
			{ ...data, id: selectedJenisKelas.id },
			{
				onSuccess: () => {
					closeDrawer();
					clearSelected();
					form.reset();
				},
			},
		);
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			closeDrawer();
			clearSelected();
		}
	};

	return (
		<EditDrawer
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title="Edit Jenis Kelas"
			description="Ubah informasi jenis kelas."
			submitText="Simpan Perubahan"
			cancelText="Batal"
			isPending={mutations.update.isPending}
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<Form {...form}>
				<div className="px-4 pb-4">
					<JenisKelasForm form={form} onSubmit={onSubmit} />
				</div>
			</Form>
		</EditDrawer>
	);
}
