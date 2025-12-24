"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ScrollAnimation } from "@/app/_components/shared/scroll-animation";
import { Button } from "@/components/ui/button";
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
			email: "",
			alamat: "",
			gender: undefined as unknown as "LAKI_LAKI" | "PEREMPUAN",
			umur: undefined as unknown as number,
			asalSekolah: "",
			kelasSekolah: "",
			jamPulang: "",
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
			className="bg-muted/30 flex min-h-screen items-center px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
		>
			<div className="mx-auto w-full max-w-7xl">
				<ScrollAnimation
					variant="fadeUp"
					className="mb-10 text-center"
					once={true}
				>
					<h2 className="mb-2 text-3xl font-bold sm:text-4xl">
						Daftar Sekarang
					</h2>
					<p className="text-muted-foreground">
						Isi form di bawah ini, tim kami akan menghubungi Anda dalam 1x24
						jam.
					</p>
				</ScrollAnimation>

				<ScrollAnimation variant="zoomIn" delay={0.2} once={true}>
					<Card>
						<CardContent className="pt-6">
							<Form {...form}>
								<MuridForm onSubmit={onSubmit} />

								<div className="mt-4">
									<Button
										type="submit"
										size="sm"
										className="w-full"
										disabled={mutations.create.isPending}
										onClick={form.handleSubmit(onSubmit)}
									>
										{mutations.create.isPending
											? "Mengirim..."
											: "Kirim Pendaftaran"}
									</Button>
								</div>
							</Form>
						</CardContent>
					</Card>
				</ScrollAnimation>
			</div>
		</section>
	);
}
