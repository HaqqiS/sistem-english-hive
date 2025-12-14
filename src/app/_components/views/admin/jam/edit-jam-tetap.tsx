"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useJamTetapStore } from "@/store/useMasterDataStore";
import JamForm from "./jam-tetap-form";
import {
	clientJamSchema,
	type TypeClientJamTetapSchema,
} from "@/types/jam.type";
import { useJam } from "@/hooks/useJam";

export default function EditJamTetap() {
	const { isDrawerOpen, selectedJam, closeDrawer, clearSelected } =
		useJamTetapStore();

	const editJamForm = useForm<TypeClientJamTetapSchema>({
		resolver: zodResolver(clientJamSchema),
		values: selectedJam
			? {
					cabangId: selectedJam.cabangId ?? "",
					jamMulai: selectedJam.jamMulai ?? "",
					jamSelesai: selectedJam.jamSelesai ?? "",
					namaSlot: selectedJam.namaSlot ?? "",
				}
			: undefined,
		defaultValues: {
			cabangId: selectedJam?.cabangId,
			jamMulai: selectedJam?.jamMulai,
			jamSelesai: selectedJam?.jamSelesai,
			namaSlot: selectedJam?.namaSlot,
		},
	});

	// useEffect(() => {
	//   if (selectedJam) {
	//     editJamForm.reset({
	//       cabangId: selectedJam.cabangId,
	//       jamMulai: selectedJam.jamMulai,
	//       jamSelesai: selectedJam.jamSelesai,
	//       namaSlot: selectedJam.namaSlot,
	//     });
	//   }
	// }, [selectedJam]);

	const isOpen = isDrawerOpen("edit");

	const { tetapMutations } = useJam({
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

	const handleSubmitEdit = async (data: TypeClientJamTetapSchema) => {
		if (!selectedJam) return;

		await tetapMutations.update.mutateAsync({
			id: selectedJam.id,
			...data,
		});
	};

	return (
		<EditDrawer
			isOpen={isOpen}
			onOpenChange={(open) => !open && closeDrawer()}
			title="Edit Jam Tetap"
			description="Ubah informasi Jam Tetap yang sudah ada"
			onSubmit={editJamForm.handleSubmit(handleSubmitEdit)}
			isPending={tetapMutations.update.isPending}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...editJamForm}>
				<JamForm onSubmit={handleSubmitEdit} />
			</Form>
		</EditDrawer>
	);
}
