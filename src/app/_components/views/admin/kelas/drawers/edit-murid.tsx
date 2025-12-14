"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	clientUpdatePendaftaranKelasSchema,
	type TypeClientUpdatePendaftaranKelasSchema,
} from "@/types/pendaftaranKelas.type";
import { usePendaftaranKelasStore } from "@/store/useKelasStore";
import EditPendaftaranKelasForm from "../forms/edit-pendaftaran-kelas-form";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";

export default function EditMuridDetailKelas() {
	const { isDrawerOpen, selectedPendaftaran, closeDrawer, clearSelected } =
		usePendaftaranKelasStore();

	const form = useForm<TypeClientUpdatePendaftaranKelasSchema>({
		resolver: zodResolver(clientUpdatePendaftaranKelasSchema),
		values: selectedPendaftaran
			? {
					muridId: selectedPendaftaran.muridId,
					kelasId: selectedPendaftaran.kelasId,
					tanggalMulai: selectedPendaftaran.tanggalMulai,
					isAktif: selectedPendaftaran.isAktif,
				}
			: undefined,
		defaultValues: {
			muridId: selectedPendaftaran?.muridId,
			kelasId: selectedPendaftaran?.kelasId,
			tanggalMulai: selectedPendaftaran?.tanggalMulai ?? "",
			isAktif: selectedPendaftaran?.isAktif ?? false,
		},
	});


	const isOpen = isDrawerOpen("edit");

	const { mutations } = usePendaftaranKelas({
		onSuccessUpdate: () => {
			closeDrawer();
			clearSelected();
			form.reset();
		},
	});

	const handleSubmitEdit = async (
		data: TypeClientUpdatePendaftaranKelasSchema,
	) => {
		if (!selectedPendaftaran) return;

		await mutations.update.mutateAsync({
			id: selectedPendaftaran.id,
			...data,
		});
	};

	return (
		<EditDrawer
			isOpen={isOpen}
			onOpenChange={(open) => !open && closeDrawer()}
			title="Edit Pendaftaran Kelas"
			description="Ubah informasi pendaftaran yang sudah ada"
			onSubmit={form.handleSubmit(handleSubmitEdit)}
			isPending={mutations.update.isPending}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...form}>
				<EditPendaftaranKelasForm onSubmit={handleSubmitEdit} />
			</Form>
		</EditDrawer>
	);
}
