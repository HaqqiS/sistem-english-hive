"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import InputPassword from "@/app/_components/shared/input-password";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { api } from "@/trpc/react";
import {
	type UpdatePasswordFormSchema,
	updatePasswordFormSchema,
} from "@/types/user.type";

export default function ChangePasswordForm() {
	const form = useForm<UpdatePasswordFormSchema>({
		resolver: zodResolver(updatePasswordFormSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmNewPassword: "",
		},
	});

	const changePassword = api.user.updateMyPasswordSelf.useMutation({
		onSuccess: () => {
			toast.success("Kata sandi berhasil diubah!");
			form.reset();
		},
		onError: (err) => {
			toast.error(`Gagal mengubah kata sandi: ${err.message}`);
		},
	});

	const onSubmit = (values: UpdatePasswordFormSchema) => {
		changePassword.mutate(values);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="currentPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Kata Sandi Saat Ini</FormLabel>
							<FormControl>
								<InputPassword placeholder="******" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="newPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Kata Sandi Baru</FormLabel>
							<FormControl>
								<InputPassword placeholder="******" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="confirmNewPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
							<FormControl>
								<InputPassword placeholder="******" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={changePassword.isPending}>
					{changePassword.isPending ? "Menyimpan..." : "Ubah Kata Sandi"}
				</Button>
			</form>
		</Form>
	);
}
