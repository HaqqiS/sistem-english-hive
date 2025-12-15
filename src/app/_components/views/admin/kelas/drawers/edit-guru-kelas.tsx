"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { UseHistoryGuruKelas } from "@/hooks/useHistoryGuruKelas";
import { useGuruKelasStore } from "@/store/useKelasStore";
import {
	type TypeUpdateHistoryGuruKelasSchema,
	updateHistoryGuruKelasSchema,
} from "@/types/historyGuruKelas.type";
import EditGuruKelasForm from "../forms/edit-guru-kelas-form";

export default function EditGuruKelas() {
	const { isDrawerOpen, selectedHistoryGuruKelas, closeDrawer } =
		useGuruKelasStore();

	const guruKelasForm = useForm<TypeUpdateHistoryGuruKelasSchema>({
		resolver: zodResolver(updateHistoryGuruKelasSchema),
		values: selectedHistoryGuruKelas
			? {
					guruId: selectedHistoryGuruKelas.guruId ?? "",
					mulaiPada: selectedHistoryGuruKelas.mulaiPada ?? "",
					kelasId: selectedHistoryGuruKelas.kelasId ?? "",
				}
			: undefined,
		defaultValues: {
			guruId: selectedHistoryGuruKelas?.guruId,
			mulaiPada: selectedHistoryGuruKelas?.mulaiPada,
			kelasId: selectedHistoryGuruKelas?.kelasId,
		},
	});

	// useEffect(() => {
	//   if (selectedHistoryGuruKelas) {
	//     guruKelasForm.reset({
	//       guruId: selectedHistoryGuruKelas.guruId ?? "",
	//       mulaiPada: selectedHistoryGuruKelas.mulaiPada ?? "",
	//       kelasId: selectedHistoryGuruKelas.kelasId ?? "",
	//     });
	//   }
	// }, [selectedHistoryGuruKelas, guruKelasForm]);

	const isOpen = isDrawerOpen("edit");

	const { mutations } = UseHistoryGuruKelas({
		onSuccessUpdate: () => {
			closeDrawer();
			// clearSelected();
			guruKelasForm.reset();
		},
	});

	const handleSubmitEdit = async (data: TypeUpdateHistoryGuruKelasSchema) => {
		if (!selectedHistoryGuruKelas) return;

		await mutations.update.mutateAsync({
			id: selectedHistoryGuruKelas.id,
			...data,
		});
	};

	return (
		<EditDrawer
			isOpen={isOpen}
			onOpenChange={(open) => !open && closeDrawer()}
			title="Edit Guru Kelas"
			description="Ubah informasi guru kelas yang sudah ada"
			onSubmit={guruKelasForm.handleSubmit(handleSubmitEdit)}
			isPending={mutations.update.isPending}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...guruKelasForm}>
				<EditGuruKelasForm onSubmit={handleSubmitEdit} />
			</Form>
		</EditDrawer>
	);
}
