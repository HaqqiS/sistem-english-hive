"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { StatusMurid } from "@prisma/client";
import { useForm } from "react-hook-form";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { useMurid } from "@/hooks/useMurid";
import { useMuridStore } from "@/store/useMuridStore";
import {
	type TypeUpdateStatusMuridSchema,
	updateStatusMuridSchema,
} from "@/types/murid.type";
import EditStatusMuridForm from "../form/edit-status-murid-form";

export default function EditMuridNotRegistered() {
	const { isDrawerOpen, selectedMurid, closeDrawer, clearSelected } =
		useMuridStore();

	const isOpen = isDrawerOpen("edit-status");

	const form = useForm<TypeUpdateStatusMuridSchema>({
		resolver: zodResolver(updateStatusMuridSchema),
		values: selectedMurid
			? {
					id: selectedMurid.id,
					statusMurid: selectedMurid.statusMurid ?? StatusMurid.NON_AKTIF,
				}
			: undefined,
		defaultValues: {
			id: "",
			statusMurid: StatusMurid.NON_AKTIF,
		},
	});

	const { mutations } = useMurid({
		onSuccessUpdate: () => {
			closeDrawer();
			clearSelected();
			form.reset();
		},
	});

	const onSubmit = (data: TypeUpdateStatusMuridSchema) => {
		mutations.updateStatus.mutate(data);
	};

	if (!selectedMurid) return null;

	return (
		<EditDrawer
			title="Edit Status Murid"
			description={`Ubah status untuk ${selectedMurid.namaLengkap}`}
			isOpen={isOpen}
			onOpenChange={(open) => !open && closeDrawer()}
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.updateStatus.isPending}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...form}>
				<EditStatusMuridForm onSubmit={onSubmit} />
			</Form>
		</EditDrawer>
	);
}
