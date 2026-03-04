"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { useCabang } from "@/hooks/useCabang";
import { useCabangStore } from "@/store/useMasterDataStore";
import {
	clientCabangSchema,
	type TypeClientCabangSchema,
} from "@/types/cabang.type";
import CabangForm from "./cabang-form";

export default function EditCabang() {
	const { isDrawerOpen, selectedCabang, closeDrawer, clearSelected } =
		useCabangStore();

	const editCabangForm = useForm<TypeClientCabangSchema>({
		resolver: zodResolver(clientCabangSchema),
		values: selectedCabang
			? {
					namaCabang: selectedCabang.namaCabang,
					alamat: selectedCabang.alamat,
					noTelp: selectedCabang.noTelp,
					noRekening: selectedCabang.noRekening ?? "",
					bank: selectedCabang.bank ?? "",
					atasNama: selectedCabang.atasNama ?? "",
				}
			: undefined,
		defaultValues: {
			namaCabang: selectedCabang?.namaCabang,
			alamat: selectedCabang?.alamat,
			noTelp: selectedCabang?.noTelp,
			noRekening: selectedCabang?.noRekening ?? "",
			bank: selectedCabang?.bank ?? "",
			atasNama: selectedCabang?.atasNama ?? "",
		},
	});

	const isOpen = isDrawerOpen("edit");

	const { mutations } = useCabang({
		onSuccessUpdate: () => {
			closeDrawer();
			clearSelected();
			editCabangForm.reset();
		},
	});

	const handleSubmitEdit = async (data: TypeClientCabangSchema) => {
		if (!selectedCabang) return;

		await mutations.update.mutateAsync({
			id: selectedCabang.id,
			...data,
		});
	};

	return (
		<EditDrawer
			isOpen={isOpen}
			onOpenChange={(open) => !open && closeDrawer()}
			title="Edit Cabang"
			description="Ubah informasi cabang yang sudah ada"
			onSubmit={editCabangForm.handleSubmit(handleSubmitEdit)}
			isPending={mutations.update.isPending}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...editCabangForm}>
				<CabangForm onSubmit={handleSubmitEdit} />
			</Form>
		</EditDrawer>
	);
}
