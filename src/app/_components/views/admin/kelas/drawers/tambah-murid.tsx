import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePendaftaranKelas } from "@/hooks/usePendaftaranKelas";
import {
	clientTambahMuridSchema,
	type TypeClientTambahMuridSchema,
} from "@/types/pendaftaranKelas.type";
import PendaftaranMuridForm from "../forms/pendaftaran-murid-form";

interface TambahMuridDetailKelasProps {
	kelasId?: string;
}

export default function TambahMuridDetailKelas({
	kelasId,
}: TambahMuridDetailKelasProps) {
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<TypeClientTambahMuridSchema>({
		resolver: zodResolver(clientTambahMuridSchema),
		defaultValues: {
			muridId: "",
		},
	});

	const { mutations } = usePendaftaranKelas({
		onSuccessCreate: () => {
			form.reset();
			setIsOpen(false);
		},
	});

	const onSubmit = (values: TypeClientTambahMuridSchema) => {
		// console.log("values:", values);
		mutations.create.mutate({
			...values,
			kelasId: kelasId ?? "",
		});
	};

	return (
		<AddDrawer
			title="Tambah Murid ke Kelas"
			description="Tambahkan murid baru ke kelas ini"
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.create.isPending}
			submitText="Tambah Murid"
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
				<PendaftaranMuridForm onSubmit={onSubmit} />
			</Form>
		</AddDrawer>
	);
}
