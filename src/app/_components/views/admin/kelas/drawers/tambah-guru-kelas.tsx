"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";
import {
	clientHistoryGuruKelasSchema,
	type TypeClientHistoryGuruKelasSchema,
} from "@/types/historyGuruKelas.type";
import GuruKelasForm from "../forms/guru-kelas-form";

interface TambahGuruKelasProps {
	kelasId: string;
}
export default function TambahGuruKelas({ kelasId }: TambahGuruKelasProps) {
	const [isOpen, setIsOpen] = useState(false);

	const guruKelasForm = useForm<TypeClientHistoryGuruKelasSchema>({
		resolver: zodResolver(clientHistoryGuruKelasSchema),
		defaultValues: {
			guruId: "",
			mulaiPada: "",
			statusGuru: "ACTIVE",
			kelasId: kelasId,
		},
	});

	const { mutations: historyMutations } = UseHistoryGuruKelas({
		onSuccessCreate: () => {
			setIsOpen(false);
			guruKelasForm.reset();
		},
	});

	const onSubmit = (values: TypeClientHistoryGuruKelasSchema) => {
		historyMutations.create.mutate(values);
	};

	return (
		<>
			{/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

			<AddDrawer
				title="Tambah Guru Kelas"
				description="Tambahkan guru kelas baru ke sistem"
				onSubmit={guruKelasForm.handleSubmit(onSubmit)}
				isPending={historyMutations.create.isPending}
				submitText="Tambah Guru Kelas"
				cancelText="Batal"
				trigger={
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Tambah Guru Kelas
					</Button>
				}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
			>
				<Form {...guruKelasForm}>
					<GuruKelasForm />
				</Form>
			</AddDrawer>
		</>
	);
}
