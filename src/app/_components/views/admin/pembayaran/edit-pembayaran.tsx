"use client";

import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	clientUpdatePembayaranSchema, // Use Client Schema
	type TypeClientUpdatePembayaranSchema,
} from "@/types/pembayaran.type";
import { usePembayaran } from "@/hooks/usePembayaran";
import { usePembayaranStore } from "@/store/usePembayaranStore";
import { formatDateToYYYYMMDD } from "@/utils/dateUtils";
import EditPembayaranForm from "./edit-pembayaran-form";

export default function EditPembayaran() {
	const { isDrawerOpen, selectedPembayaran, closeDrawer, clearSelected } =
		usePembayaranStore();

	const isOpen = isDrawerOpen("edit");

	// Use Client Schema type here
	const form = useForm<TypeClientUpdatePembayaranSchema>({
		resolver: zodResolver(clientUpdatePembayaranSchema),
		values: selectedPembayaran
			? {
					id: selectedPembayaran.id,
					statusBayar: selectedPembayaran.statusBayar,
					jumlahBayar: selectedPembayaran.jumlahBayar,
					// Convert Date object to YYYY-MM-DD string for the form
					tanggalBayar: selectedPembayaran.tanggalBayar
						? formatDateToYYYYMMDD(selectedPembayaran.tanggalBayar)
						: undefined,
					note: selectedPembayaran.note ?? "",
				}
			: undefined,
		defaultValues: {
			id: "",
			statusBayar: "BELUM_LUNAS",
			jumlahBayar: 0,
			tanggalBayar: undefined,
			note: "",
		},
	});

	// Populate form when drawer opens
	// useEffect(() => {
	//   if (selectedPembayaran && isOpen) {
	//     form.reset({
	//       id: selectedPembayaran.id,
	//       statusBayar: selectedPembayaran.statusBayar,
	//       jumlahBayar: selectedPembayaran.jumlahBayar,
	//       // Convert Date object to YYYY-MM-DD string for the form
	//       tanggalBayar: selectedPembayaran.tanggalBayar
	//         ? formatDateToYYYYMMDD(selectedPembayaran.tanggalBayar)
	//         : undefined,
	//       note: selectedPembayaran.note ?? "",
	//     });
	//   }
	// }, [selectedPembayaran, isOpen, form]);

	const { mutations } = usePembayaran({
		onSuccessUpdate: () => {
			// Changed to onSuccessUpdate as per your hook update
			closeDrawer();
			clearSelected();
			form.reset();
		},
	});

	const onSubmit = (data: TypeClientUpdatePembayaranSchema) => {
		// The mutation expects a Date object (from server schema)
		// But 'data' here has a string string because of client schema.
		// We need to manually convert it before sending to mutation if the mutation expects TypeUpdatePembayaranSchema
		// OR, simpler: we rely on TRPC to handle the transformation if we passed the raw input?
		// Ideally, the mutation input type in router should match what we send.

		// Since we split the schema, let's check the router.
		// The router uses 'updatePembayaranSchema' which does the transform.
		// So we can pass the string, and Zod on the server will transform it to Date.

		// However, TypeScript on the client might complain if the mutation input type (inferred from router)
		// expects the *Input* type of the Zod schema (which is string) vs the *Output* type.
		// TRPC usually infers the Input type of the Zod schema for mutation arguments.
		// So passing string is correct!

		mutations.update.mutate({
			...data,
			tanggalBayar: data.tanggalBayar ?? undefined, // Ensure empty string becomes undefined if needed
		});
	};

	return (
		<EditDrawer
			title="Edit Detail Pembayaran"
			description="Ubah status, nominal, atau catatan pembayaran."
			isOpen={isOpen}
			onOpenChange={(open) => !open && closeDrawer()}
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.update.isPending}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...form}>
				<EditPembayaranForm onSubmit={onSubmit} />
			</Form>
		</EditDrawer>
	);
}
