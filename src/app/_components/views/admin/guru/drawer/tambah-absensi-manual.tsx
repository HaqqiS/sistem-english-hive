"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { StatusAbsenGuru } from "@prisma/client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAbsenGuru } from "@/hooks/useAbsenGuru";
import {
	manualAbsensiFormSchema,
	type TypeClientCreateManualAbsensiSchema,
	type TypeCreateManualAbsensiData,
	type TypeManualAbsensiFormSchema,
} from "@/types/absenGuru.type";
import ManualAbsensiForm from "../form/manual-absensi-form";

interface TambahAbsensiManualProps {
	defaultGuruId?: string;
}

export default function TambahAbsensiManual({
	defaultGuruId,
}: TambahAbsensiManualProps) {
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

	const form = useForm<TypeManualAbsensiFormSchema>({
		resolver: zodResolver(manualAbsensiFormSchema),
		defaultValues: {
			guruId: defaultGuruId ?? "",
			kelasId: "",
			status: StatusAbsenGuru.HADIR,
			isVerified: true,
			isSubstitute: false,
			time: "09:00",
		},
	});

	const { mutations } = useAbsenGuru({
		onSuccessCreateManual: (data: TypeCreateManualAbsensiData) => {
			// Get verified kelasId BEFORE reset
			const kelasId = form.getValues("kelasId");

			form.reset();
			setIsOpen(false);

			// Redirect to Sesi Detail / Kelas Sesi
			if (data?.sesiPertemuanKelasId && kelasId) {
				router.push(`/admin/kelas/sesi/${kelasId}`);
			}
		},
	});

	const onSubmit = (values: TypeManualAbsensiFormSchema) => {
		const { isSubstitute, time, tanggalWaktu, guruAsliId, ...rest } = values;

		const finalDate = tanggalWaktu;
		if (finalDate && time) {
			const [hours, minutes] = time.split(":").map(Number);
			if (hours !== undefined && minutes !== undefined) {
				finalDate.setHours(hours, minutes);
			}
		}

		// Prepare Payload
		const payload: TypeClientCreateManualAbsensiSchema = {
			...rest,
			tanggalWaktu: finalDate,
			// If not substitute, clean guruAsliId? It's optional anyway.
			// The router doesn't use guruAsliId, it uses guruId.
			// If isSubstitute is TRUE, guruId IS the attendee (which is correct).
			// If isSubstitute is FALSE, guruId IS the attendee (which is correct).
			// We just need to make sure we don't send garbage.
			guruAsliId: isSubstitute ? guruAsliId : undefined,
		};

		mutations.createManual.mutate(payload);
	};

	return (
		<AddDrawer
			title="Buat Absensi Manual"
			description="Buat absensi guru secara manual untuk sesi yang terlupakan atau guru pengganti."
			onSubmit={form.handleSubmit(onSubmit)}
			isPending={mutations.createManual.isPending}
			submitText="Simpan & Buka Sesi"
			cancelText="Batal"
			trigger={
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Absen Manual
				</Button>
			}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<Form {...form}>
				<ManualAbsensiForm onSubmit={onSubmit} defaultGuruId={defaultGuruId} />
			</Form>
		</AddDrawer>
	);
}
