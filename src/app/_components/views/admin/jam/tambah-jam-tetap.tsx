"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useJam } from "@/hooks/useJam";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import {
	clientJamSchema,
	type TypeClientJamTetapSchema,
} from "@/types/jam.type";
import JamForm from "./jam-tetap-form";

export default function TambahJamTetap() {
	const { activeCabangId } = useGlobalCabangStore();
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<TypeClientJamTetapSchema>({
		resolver: zodResolver(clientJamSchema),
		defaultValues: {
			cabangId: activeCabangId,
			namaSlot: "",
			jamMulai: "",
			jamSelesai: "",
		},
	});

	const { tetapMutations } = useJam({
		onSuccessCreate: () => {
			setIsOpen(false);
			form.reset();
		},
	});

	const onSubmit = (values: TypeClientJamTetapSchema) => {
		tetapMutations.create.mutate(values);
	};

	return (
		<AddDrawer
			title="Tambah Jam Pertemuan"
			description="Tambahkan jam pertemuan baru."
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={tetapMutations.create.isPending}
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
