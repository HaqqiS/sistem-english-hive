"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useMurid } from "@/hooks/useMurid";
import {
	RegisterMuridSchema,
	type TypeClientRegisterMuridInput,
	type TypeClientRegisterMuridSchema,
} from "@/types/murid.type";
import MuridForm from "../views/admin/murid/form/murid-form";

export default function Registration() {
	const { mutations } = useMurid({
		enableQuery: false,
		onSuccessCreate: () => {
			form.reset();
		},
	});

	// Note: MuridForm might expect default values or type compatibility
	// Ensure TypeClientRegisterMuridSchema matches what MuridForm expects
	const form = useForm<
		TypeClientRegisterMuridInput,
		undefined,
		TypeClientRegisterMuridSchema
	>({
		resolver: zodResolver(RegisterMuridSchema),
		defaultValues: {
			namaLengkap: "",
			// email, alamat, kelasSekolah removed
			gender: undefined as unknown as "LAKI_LAKI" | "PEREMPUAN",
			umur: undefined as unknown as number,
			asalSekolah: "",
			kelasSekolah: "",
			instagram: "", // [NEW]
			// jamPulang: "",
			noWA: "",
			cabangId: "",
			pilihanProgram: "",
			sumberInfo: "",
			withRegistrationFee: true,
		},
	});

	function onSubmit(data: TypeClientRegisterMuridSchema) {
		mutations.create.mutate(data);
	}

	return (
		<section
			id="registration"
			className="from-primary/5 via-background to-secondary/10 flex min-h-screen items-center bg-gradient-to-b px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
		>
			<div className="mx-auto w-full max-w-4xl">
				<ScrollAnimation
					variant="fadeUp"
					className="mb-10 text-center"
					once={true}
				>
					<h2 className="mb-3 text-3xl font-bold sm:text-4xl">
						Daftar <span className="text-primary">Sekarang</span>
					</h2>
					<p className="text-muted-foreground text-lg">
						Isi form di bawah ini, tim kami akan menghubungi Anda dalam 1x24
						jam.
					</p>
				</ScrollAnimation>

				<Card className="border-primary/15 shadow-primary/5 overflow-hidden shadow-lg">
					<div className="from-primary to-secondary h-1.5 w-full bg-gradient-to-r" />
					<CardContent className="p-6 sm:p-10 lg:p-12">
						<Form {...form}>
							<MuridForm
								onSubmit={onSubmit}
								isPending={mutations.create.isPending}
							/>
						</Form>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
