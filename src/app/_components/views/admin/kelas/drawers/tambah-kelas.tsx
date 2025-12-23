"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";
import { useKelas } from "@/hooks/useKelas";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import {
	clientHistoryGuruKelasSchema,
	type TypeClientHistoryGuruKelasSchema,
} from "@/types/historyGuruKelas.type";
import {
	clientKelasSchema,
	type TypeClientKelasSchema,
} from "@/types/kelas.type";
import GuruKelasForm from "../forms/guru-kelas-form";
import KelasForm from "../forms/kelas-form";

export default function TambahKelas() {
	const [isOpen, setIsOpen] = useState(false);
	const { activeCabangId } = useGlobalCabangStore();

	const form = useForm<TypeClientKelasSchema>({
		resolver: zodResolver(clientKelasSchema),
		defaultValues: {
			jenisKelasId: "",
			level: 1,
			tipe: "REGULAR", // Default or empty? Empty string might be safer if controlled by Select
			// But form expects 'tipe' to be present.
			// Let's set undefined or "" depending on what schema allows (schema allows string optional?)
			// Client Schema: tipe is determined by ID. But kept in watched fields.
			// Let's use empty string "" for initial.
			// tipe: "",
			grup: "",
			kodeKelas: "",
			bulanTahunAjar: "",
			hargaKelas: 0,
			deskripsi: "",
			cabangId: activeCabangId ?? "",
		},
	});

	const guruKelasForm = useForm<TypeClientHistoryGuruKelasSchema>({
		resolver: zodResolver(clientHistoryGuruKelasSchema),
		defaultValues: {
			guruId: "",
			mulaiPada: "",
			statusGuru: "ACTIVE",
			kelasId: "",
		},
	});

	const { mutations: kelasMutations } = useKelas({
		onSuccessCreate: (newKelas) => {
			const historyValues = guruKelasForm.getValues();

			if (historyValues.guruId) {
				historyMutations.create.mutate({
					...historyValues,
					kelasId: newKelas.id,
				});
			}

			setIsOpen(false);
			form.reset();
			guruKelasForm.reset();
		},
	});

	const { mutations: historyMutations } = UseHistoryGuruKelas({
		onSuccessCreate: () => {
			setIsOpen(false);
			form.reset();
			guruKelasForm.reset();
		},
	});

	const onSubmit = (values: TypeClientKelasSchema) => {
		kelasMutations.create.mutate(values);
	};

	const isPending =
		kelasMutations.create.isPending || historyMutations.create.isPending;

	return (
		<>
			{/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

			<AddDrawer
				title="Tambah Program Kelas"
				description="Tambahkan program kelas baru ke sistem"
				onSubmit={form.handleSubmit(onSubmit)}
				isPending={isPending}
				submitText="Tambah Program Kelas"
				cancelText="Batal"
				trigger={
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Tambah Program Kelas
					</Button>
				}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
			>
				<Form {...form}>
					<KelasForm onSubmit={onSubmit} />
				</Form>

				<Form {...guruKelasForm}>
					<GuruKelasForm isDisabled={isPending} />
				</Form>
			</AddDrawer>
		</>
	);
}
