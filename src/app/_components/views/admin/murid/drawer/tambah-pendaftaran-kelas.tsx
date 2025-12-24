"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import {
	clientBulkPendaftaranKelasSchema,
	type TypeClientBulkPendaftaranKelasSchema,
} from "@/types/pendaftaranKelas.type";
import PendaftaranKelasForm from "../form/pendaftaran-kelas-form";

export default function TambahPendaftaranKelas() {
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<TypeClientBulkPendaftaranKelasSchema>({
		resolver: zodResolver(
			clientBulkPendaftaranKelasSchema,
		) as Resolver<TypeClientBulkPendaftaranKelasSchema>,
		defaultValues: {
			muridIds: [],
			kelasId: "",
			tanggalMulai: null,
		},
	});

	const { mutations } = usePendaftaranKelas({
		onSuccessCreate: () => {
			form.reset();
			setIsOpen(false);
		},
	});

	const onSubmit = (values: TypeClientBulkPendaftaranKelasSchema) => {
		// console.log("values:", values);
		mutations.createBulk.mutate(values);
	};

	return (
		<AddDrawer
			title="Daftarkan Murid ke Kelas"
			description="Tambahkan data pendaftaran kelas baru dengan mengisi form di bawah ini."
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.createBulk.isPending}
			submitText="Tambah Pendaftaran Kelas"
			cancelText="Batal"
			trigger={
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					<p className="sr-only lg:not-sr-only">Daftarkan Murid ke Kelas</p>
					<p className="not-sr-only lg:sr-only">Daftarkan Murid</p>
				</Button>
			}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<Form {...form}>
				<PendaftaranKelasForm onSubmit={onSubmit} />
			</Form>
		</AddDrawer>
	);
}
