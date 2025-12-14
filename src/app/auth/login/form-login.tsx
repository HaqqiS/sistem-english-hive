"use client";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { loginFormSchema, type LoginFormSchema } from "@/types/user.type";
import { useForm } from "react-hook-form";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import InputPassword from "@/app/_components/shared/input-password";
import { useState } from "react";
import { UserRole } from "@/server/auth/type";

export default function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const rawCallbackUrl = searchParams.get("callbackUrl");
	const callbackUrl =
		rawCallbackUrl &&
		rawCallbackUrl !== "/" &&
		!rawCallbackUrl.includes("/auth")
			? rawCallbackUrl
			: null;
	const [isPending, setIsPending] = useState(false);

	// HOOK FORMS
	const loginForm = useForm<LoginFormSchema>({
		resolver: zodResolver(loginFormSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});
	const { setError } = loginForm;

	//HANDLERS
	const handleSubmit = async (data: LoginFormSchema) => {
		setIsPending(true);
		let toastId: string | number | undefined;

		try {
			// 2. Tampilkan toast loading di awal
			toastId = toast.loading("Mencoba untuk login...");

			const result = await signIn("credentials", {
				email: data.email,
				password: data.password,
				redirect: false,
			});

			if (result?.error) {
				throw new Error("Email atau password yang Anda masukkan salah.");
			}
			toast.success("Login berhasil! Mengarahkan ke dashboard...", {
				id: toastId,
				duration: 2000,
			});

			const session = await getSession();
			const role = session?.user?.role;
			await new Promise((resolve) => setTimeout(resolve, 800));

			let targetUrl = "/";

			if (callbackUrl) {
				targetUrl = callbackUrl;
			} else {
				// B. Jika login normal, arahkan sesuai Role
				if (role === UserRole.MANAGER || role === UserRole.ADMIN) {
					targetUrl = "/admin";
				} else if (role === UserRole.GURU) {
					targetUrl = "/guru";
				}
			}
			router.replace(targetUrl);
			router.refresh();
		} catch (error) {
			if (toastId) {
				toast.dismiss(toastId);
			}

			if (error instanceof Error) {
				setError("root", { message: error.message });
				toast.error(error.message);
			} else {
				const errorMessage = "Terjadi kesalahan tidak dikenal.";
				setError("root", { message: errorMessage });
				toast.error(errorMessage);
			}
			setIsPending(false);
		}
	};

	return (
		<Form {...loginForm}>
			<form onSubmit={loginForm.handleSubmit(handleSubmit)}>
				<div className="flex flex-col gap-6">
					<div className="grid gap-3">
						<FormField
							control={loginForm.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="ahmad@mail.com"
											{...field}
											autoFocus
											required
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid gap-3">
						<FormField
							control={loginForm.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<InputPassword {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="flex flex-col gap-3">
						<FormField
							control={loginForm.control}
							name="root"
							render={({ fieldState }) => (
								<FormMessage>{fieldState.error?.message}</FormMessage>
							)}
						/>
						<Button
							type="submit"
							className="w-full"
							disabled={loginForm.formState.isSubmitting || isPending}
						>
							Login
						</Button>
					</div>
				</div>
			</form>
		</Form>
	);
}
