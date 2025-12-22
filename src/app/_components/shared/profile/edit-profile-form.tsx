"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import {
	type UpdateProfileFormSchema,
	updateProfileFormSchema,
} from "@/types/user.type";

export default function EditProfileForm() {
	const { data: session, update: updateSession } = useSession();

	const form = useForm<UpdateProfileFormSchema>({
		resolver: zodResolver(updateProfileFormSchema),
		defaultValues: {
			name: "",
			email: "",
		},
	});

	// Pre-fill form from session
	useEffect(() => {
		if (session?.user) {
			form.reset({
				name: session.user.name,
				email: session.user.email,
			});
		}
	}, [session, form]);

	const updateProfile = api.user.updateMyProfileSelf.useMutation({
		onSuccess: async (data) => {
			toast.success("Profil berhasil diperbarui!");
			// Update client-side session to reflect changes immediately
			await updateSession({
				user: {
					name: data.name,
					email: data.email,
				},
			});
		},
		onError: (err) => {
			toast.error(`Gagal memperbarui profil: ${err.message}`);
		},
	});

	const onSubmit = (values: UpdateProfileFormSchema) => {
		updateProfile.mutate(values);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nama Lengkap</FormLabel>
							<FormControl>
								<Input placeholder="Nama Anda" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder="email@contoh.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={updateProfile.isPending}>
					{updateProfile.isPending ? "Menyimpan..." : "Simpan Perubahan"}
				</Button>
			</form>
		</Form>
	);
}
