"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useJam } from "@/hooks/useJam";
import {
	clientJamCustomSchema,
	type TypeClientJamCustomSchema,
} from "@/types/jam.type";
import JamForm from "./jam-custom-form";

export default function TambahJam() {
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<TypeClientJamCustomSchema>({
		resolver: zodResolver(clientJamCustomSchema),
		defaultValues: {
			jamMulai: "",
			jamSelesai: "",
		},
	});

	const { customMutations } = useJam({
		onSuccessCreate: () => {
			setIsOpen(false);
			form.reset();
		},
	});

	const onSubmit = (values: TypeClientJamCustomSchema) => {
		customMutations.create.mutate(values);
	};

	return (
		<AddDrawer
			title="Tambah Jam Pertemuan"
			description="Tambahkan jam pertemuan baru."
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={customMutations.create.isPending}
			submitText="Tambah Jam"
			cancelText="Batal"
			trigger={
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Tambah Jam
				</Button>
			}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<Form {...form}>
				<JamForm onSubmit={onSubmit} />
			</Form>
		</AddDrawer>
	);
}
