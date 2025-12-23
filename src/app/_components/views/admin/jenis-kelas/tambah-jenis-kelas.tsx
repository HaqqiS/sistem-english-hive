"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TipeKelas } from "@prisma/client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useJenisKelas } from "@/hooks/useJenisKelas";
import { jenisKelasSchema, type TypeJenisKelas } from "@/types/jenisKelas.type";
import { JenisKelasForm } from "./jenis-kelas-form";

export function TambahJenisKelas() {
	const [isOpen, setIsOpen] = useState(false);
	const { mutations } = useJenisKelas();

	const form = useForm<TypeJenisKelas>({
		resolver: zodResolver(jenisKelasSchema),
		defaultValues: {
			nama: "",
			tipe: TipeKelas.REGULAR,
			harga: 0,
			deskripsi: "",
			nextLevelId: null,
		},
	});

	const onSubmit = async (data: TypeJenisKelas) => {
		await mutations.create.mutateAsync(data, {
			onSuccess: () => {
				setIsOpen(false);
				form.reset();
			},
		});
	};

	return (
		<AddDrawer
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			trigger={
				<Button size="sm">
					<Plus className="mr-2 h-4 w-4" />
					Tambah Jenis Kelas
				</Button>
			}
			title="Tambah Jenis Kelas"
			description="Tambahkan program atau tingkat kelas baru."
			submitText="Simpan"
			cancelText="Batal"
			isPending={mutations.create.isPending}
			onSubmit={form.handleSubmit(onSubmit)}
		>
			{/* Pass form instance to the form component */}
			<Form {...form}>
				<div className="px-4 pb-4">
					<JenisKelasForm form={form} onSubmit={onSubmit} />
				</div>
			</Form>
		</AddDrawer>
	);
}
