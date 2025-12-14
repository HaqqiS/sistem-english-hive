import AuthLayout from "@/app/_components/layouts/auth-layout";
import LoginForm from "./form-login";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Login",
	description: "Masuk ke akun English Hive Anda.",
};

export default function LoginPage() {
	return (
		<AuthLayout
			title="Login"
			description="Enter your email and password to continue."
		>
			<LoginForm />
		</AuthLayout>
	);
}
