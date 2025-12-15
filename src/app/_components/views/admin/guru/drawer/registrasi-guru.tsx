"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import RegisterForm from "@/app/_components/views/admin/guru/form/form-register";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useUser } from "@/hooks/useUser";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import {
	type RegisterGuruFormSchema,
	registerGuruFormSchema,
} from "@/types/user.type";

export default function RegistrasiGuru() {
	const [isOpen, setIsOpen] = useState(false);

	const registrationForm = useForm<RegisterGuruFormSchema>({
		resolver: zodResolver(registerGuruFormSchema),
		defaultValues: {},
	});

	const { mutations: registrationMutations } = useUser({
		onSuccessCreate: () => {
			setIsOpen(false);
			registrationForm.reset();
		},
	});

	const { activeCabangId } = useGlobalCabangStore();

	const onSubmit = (values: RegisterGuruFormSchema) => {
		if (activeCabangId === "ALL") {
			toast.error(
				"Harus memilih salah satu cabang spesifik untuk mendaftarkan Guru.",
			);
			return;
		}
		registrationMutations.registration.mutate({
			...values,
			cabangId: activeCabangId,
		});
	};

	return (
		<AddDrawer
			title="Buat Akun Guru Baru"
			description="Tambahkan akun guru baru ke dalam sistem."
			onSubmit={registrationForm.handleSubmit(onSubmit)}
			isPending={registrationMutations.registration.isPending}
			submitText="Tambah Guru Baru"
			cancelText="Batal"
			trigger={
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Buat Akun Guru
				</Button>
			}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<Form {...registrationForm}>
				<RegisterForm onSubmit={onSubmit} />
			</Form>
		</AddDrawer>
	);
}
