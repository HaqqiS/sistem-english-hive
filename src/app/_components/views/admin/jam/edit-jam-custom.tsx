"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useJamCustomStore } from "@/store/useMasterDataStore";
import JamForm from "./jam-custom-form";
import {
	clientJamCustomSchema,
	type TypeClientJamCustomSchema,
} from "@/types/jam.type";
import { useJam } from "@/hooks/useJam";

export default function EditJam() {
	const { isDrawerOpen, selectedJam, closeDrawer, clearSelected } =
		useJamCustomStore();

	const editJamForm = useForm<TypeClientJamCustomSchema>({
		resolver: zodResolver(clientJamCustomSchema),
		values: selectedJam
			? {
					jamMulai: selectedJam.jamMulai,
					jamSelesai: selectedJam.jamSelesai,
				}
			: undefined,
		defaultValues: {
			jamMulai: selectedJam?.jamMulai,
			jamSelesai: selectedJam?.jamSelesai,
		},
	});

	// useEffect(() => {
	//   if (selectedJam) {
	//     editJamForm.reset({
	//       jamSelesai: selectedJam.jamSelesai,
	//       jamMulai: selectedJam.jamMulai,
	//     });
	//   }
	// }, [selectedJam]);

	const isOpen = isDrawerOpen("edit");

	const { customMutations } = useJam({
		onSuccessUpdate: () => {
			closeDrawer();
			clearSelected();
			editJamForm.reset();
		},
	});

	// const { mutateAsync: updateRuang, isPending: isUpdating } =
	//   api.ruang.updateRuang.useMutation({
	//     onSuccess: async () => {
	//       await apiUtils.ruang.getRuangByCabangId.invalidate();
	//       toast.success("Ruang berhasil diupdate");
	//       closeDrawer();
	//       clearSelected();
	//       editRuangForm.reset();
	//     },
	//     onError: (error) => {
	//       toast.error(`Gagal mengupdate ruang: ${error.message}`);
	//     },
	//   });

	const handleSubmitEdit = async (data: TypeClientJamCustomSchema) => {
		if (!selectedJam) return;

		await customMutations.update.mutateAsync({
			id: selectedJam.id,
			...data,
		});
	};

	return (
		<EditDrawer
			isOpen={isOpen}
			onOpenChange={(open) => !open && closeDrawer()}
			title="Edit Jam Custom"
			description="Ubah informasi jam custom yang sudah ada"
			onSubmit={editJamForm.handleSubmit(handleSubmitEdit)}
			isPending={customMutations.update.isPending}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...editJamForm}>
				<JamForm onSubmit={handleSubmitEdit} />
			</Form>
		</EditDrawer>
	);
}
