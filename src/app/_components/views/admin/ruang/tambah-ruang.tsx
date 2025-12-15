"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";
import {
	clientRuangSchema,
	type TypeClientRuangSchema,
} from "@/types/ruang.type";
import { useRuang } from "../../../../../hooks/useRuang";
import RuangForm from "./ruang-form";

export default function TambahRuang() {
	const { activeCabangId } = useGlobalCabangStore();
	const [isOpen, setIsOpen] = useState(false);

	const form = useForm<TypeClientRuangSchema>({
		resolver: zodResolver(clientRuangSchema),
		defaultValues: {
			namaRuang: "",
			cabangId: activeCabangId ?? "",
		},
	});

	const { mutations } = useRuang({
		onSuccessCreate: () => {
			form.reset();
			setIsOpen(false);
		},
	});

	const onSubmit = (values: TypeClientRuangSchema) => {
		mutations.create.mutate(values);
	};

	return (
		<>
			{/* <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Cabang
      </Button> */}

			<AddDrawer
				title="Tambah Ruang"
				description="Tambahkan ruang baru ke sistem"
				onSubmit={form.handleSubmit(onSubmit)}
				isPending={mutations.create.isPending}
				submitText="Tambah Ruang"
				cancelText="Batal"
				trigger={
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Tambah Ruang
					</Button>
				}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
			>
				<Form {...form}>
					<RuangForm onSubmit={onSubmit} />
				</Form>
			</AddDrawer>
		</>
	);
}
