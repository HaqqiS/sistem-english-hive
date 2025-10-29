import AuthLayout from "@/app/_components/layouts/auth-layout";
import LoginForm from "./form-login";

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
