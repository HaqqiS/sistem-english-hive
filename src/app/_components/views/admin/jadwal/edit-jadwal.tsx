"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form } from "@/components/ui/form";
import { useJadwalKelas } from "@/hooks/useJadwalKelas";
import { useJadwalKelasStore } from "@/store/useJadwalKelasStore";
import {
	serverUpdateJadwalSchema,
	type TypeServerUpdateJadwalSchema,
} from "@/types/jadwalKelas.type";
import EditJadwalKelasForm from "./edit-jadwal-kelas-form";

export default function EditJadwalKelas() {
	const { isDrawerOpen, selectedJadwalKelas, closeDrawer, clearSelected } =
		useJadwalKelasStore();
	const isOpen = isDrawerOpen("edit");

	const formValues: TypeServerUpdateJadwalSchema | undefined =
		selectedJadwalKelas
			? selectedJadwalKelas.jamSlotCustom
				? {
						id: selectedJadwalKelas.id,
						kelasId: selectedJadwalKelas.kelasId,
						ruangId: selectedJadwalKelas.ruangId,
						hari: selectedJadwalKelas.hari,
						tipeJam: "CUSTOM",
						jamMulai: selectedJadwalKelas.jamSlotCustom.jamMulai,
						jamSelesai: selectedJadwalKelas.jamSlotCustom.jamSelesai,
					}
				: {
						id: selectedJadwalKelas.id,
						kelasId: selectedJadwalKelas.kelasId,
						ruangId: selectedJadwalKelas.ruangId,
						hari: selectedJadwalKelas.hari,
						tipeJam: "TETAP",
						jamSlotTetapId: selectedJadwalKelas.jamSlotTetap?.id ?? "",
					}
			: undefined;

	const form = useForm<TypeServerUpdateJadwalSchema>({
		resolver: zodResolver(serverUpdateJadwalSchema),
		values: formValues, // Form otomatis terisi saat selectedJadwalKelas berubah
		defaultValues: {
			id: "",
			kelasId: "",
			ruangId: "",
			hari: undefined,
			tipeJam: "TETAP",
		},
	});

	const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
	const [conflictData, setConflictData] = useState<{
		id: string;
		kodeKelas: string;
	} | null>(null);

	const { mutations } = useJadwalKelas({
		onSuccessUpdate: (data) => {
			if (data && !data.success && data.isConflict) {
				setConflictData(data.conflictingJadwal);
				setIsSwapDialogOpen(true);
			} else {
				closeDrawer();
				clearSelected();
				form.reset();
			}
		},
	});

	const handleSubmitEdit = async (data: TypeServerUpdateJadwalSchema) => {
		await mutations.update.mutateAsync(data);
	};

	const handleSwapConfirm = async () => {
		setIsSwapDialogOpen(false);
		await mutations.update.mutateAsync({
			...form.getValues(),
			forceSwap: true,
		});
	};

	return (
		<EditDrawer
			isOpen={isOpen}
			onOpenChange={(open) => !open && closeDrawer()}
			title="Edit Jadwal Kelas"
			description="Ubah jadwal kelas yang sudah ada."
			isPending={mutations.update.isPending}
			onSubmit={form.handleSubmit(handleSubmitEdit)}
			submitText="Simpan Perubahan"
			cancelText="Batal"
		>
			<Form {...form}>
				<EditJadwalKelasForm />
			</Form>

			{/* Alert Dialog for Room Swap */}
			<AlertDialog open={isSwapDialogOpen} onOpenChange={setIsSwapDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Jadwal Bentrok!</AlertDialogTitle>
						<AlertDialogDescription>
							Ruang ini sudah dipakai oleh kelas{" "}
							<span className="font-bold text-foreground">
								{conflictData?.kodeKelas}
							</span>{" "}
							pada jam tersebut. Apakah Anda ingin menukar ruangan dan jadwal
							dengan kelas tersebut?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={mutations.update.isPending}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleSwapConfirm}
							disabled={mutations.update.isPending}
						>
							Tukar Jadwal
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</EditDrawer>
	);
}
