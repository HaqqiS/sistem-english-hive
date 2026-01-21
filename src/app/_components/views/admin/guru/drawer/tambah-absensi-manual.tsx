"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { StatusAbsenGuru } from "@prisma/client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import {
	clientCreateManualAbsensiSchema,
	type TypeClientCreateManualAbsensiSchema,
} from "@/types/absenGuru.type";
import ManualAbsensiForm from "../form/manual-absensi-form";

export default function TambahAbsensiManual() {
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<TypeClientCreateManualAbsensiSchema>({
		resolver: zodResolver(clientCreateManualAbsensiSchema),
		defaultValues: {
			guruId: "",
			kelasId: "",
			sesiPertemuanKelasId: "",
			status: StatusAbsenGuru.HADIR,
			isVerified: true,
		},
	});

	const { mutations } = useAbsenGuru({
		onSuccessCreateManual: () => {
			form.reset();
			setIsOpen(false);
		},
	});

	const onSubmit = (values: TypeClientCreateManualAbsensiSchema) => {
		const { kelasId: _kelasId, ...payload } = values;
		mutations.createManual.mutate(payload);
	};

	return (
		<AddDrawer
			title="Buat Absensi Manual"
			description="Buat absensi guru secara manual untuk sesi yang belum ada datanya."
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.createManual.isPending}
			submitText="Simpan Absensi"
			cancelText="Batal"
			trigger={
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Absen Manual
				</Button>
			}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<Form {...form}>
				<ManualAbsensiForm onSubmit={onSubmit} />
			</Form>
		</AddDrawer>
	);
}
