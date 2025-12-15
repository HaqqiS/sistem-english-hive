"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useMurid } from "@/hooks/useMurid";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import {
	RegisterMuridSchema,
	type TypeClientRegisterMuridSchema,
} from "@/types/murid.type";
import MuridForm from "../form/murid-form";

export default function RegistrasiMurid() {
	const [isOpen, setIsOpen] = useState(false);
	const { activeCabangId } = useGlobalCabangStore();

	const form = useForm<TypeClientRegisterMuridSchema>({
		resolver: zodResolver(RegisterMuridSchema),
		defaultValues: {
			namaLengkap: "",
			email: "",
			alamat: "",
			gender: undefined,
			umur: undefined,
			asalSekolah: "",
			kelasSekolah: "",
			jamPulang: "",
			noWA: "",
			cabangId: activeCabangId ?? "",
			pilihanProgram: "",
			sumberInfo: "",
			deskripsi: "",
		},
	});

	const { mutations } = useMurid({
		onSuccessCreate: () => {
			form.reset();
			setIsOpen(false);
		},
	});

	const onSubmit = (values: TypeClientRegisterMuridSchema) => {
		mutations.create.mutate(values);
	};

	return (
		<AddDrawer
			title="Tambah Murid Baru"
			description="Masukkan data murid baru secara manual."
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.create.isPending}
			submitText="Simpan Murid"
			cancelText="Batal"
			trigger={
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Tambah Murid
				</Button>
			}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<Form {...form}>
				{/* Kita gunakan idPrefix agar ID input tidak bentrok jika drawer dibuka di halaman yang sudah ada form lain */}
				<MuridForm
					onSubmit={onSubmit}
					idPrefix="admin-add-murid"
					forceStacked
				/>
			</Form>
		</AddDrawer>
	);
}
