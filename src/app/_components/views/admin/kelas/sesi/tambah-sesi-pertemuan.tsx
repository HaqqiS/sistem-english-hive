"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useSesiPertemuan } from "@/hooks/useSesiPertemuan";
import {
	clientSesiPertemuanSchema,
	type TypeClientSesiPertemuanSchema,
} from "@/types/sesiPertemuan.type";
import SesiPertemuanForm from "./sesi-pertemuan-form";

export default function TambahSesiPertemuan({
	kelasId,
	cabangId,
}: {
	kelasId?: string;
	cabangId?: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<TypeClientSesiPertemuanSchema>({
		resolver: zodResolver(clientSesiPertemuanSchema),
		defaultValues: {
			kelasId: kelasId ?? "",
			ruangId: "",
			tanggalWaktu: new Date(),
		},
	});

	// Sync kelasId if it changes
	useEffect(() => {
		if (kelasId) {
			form.setValue("kelasId", kelasId);
		}
	}, [kelasId, form]);

	const { mutations } = useSesiPertemuan({
		onSuccessCreate: () => {
			form.reset();
			setIsOpen(false);
		},
	});

	const onSubmit = (values: TypeClientSesiPertemuanSchema) => {
		console.log(values);
		mutations.create.mutate(values);
	};

	return (
		<>
			{/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

			<AddDrawer
				title="Tambah Sesi"
				description="Tambahkan Sesi baru ke sistem"
				onSubmit={form.handleSubmit(onSubmit)}
				isPending={mutations.create.isPending}
				submitText="Tambah Sesi"
				cancelText="Batal"
				trigger={
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Tambah Sesi
					</Button>
				}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
			>
				<Form {...form}>
					<SesiPertemuanForm onSubmit={onSubmit} cabangId={cabangId} />
				</Form>
			</AddDrawer>
		</>
	);
}
