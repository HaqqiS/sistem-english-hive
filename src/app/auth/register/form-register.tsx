"use client";
import { Button } from "@/app/_components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/app/_components/ui/input";
import { registerFormSchema, type RegisterFormSchema } from "@/types/user.type";
import { useForm } from "react-hook-form";
// import { Label } from "@/app/_components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InputPassword from "@/app/_components/shared/input-password";
import { api } from "@/trpc/react";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();

  // HOOK FORMS
  const registerForm = useForm<RegisterFormSchema>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const { setError } = registerForm;

  //MUTATIONS
  // const { mutateAsync: register, isPending: isPendingRegister } =
  //   api.user.registerPengurus.useMutation();

  //HANDLERS
  const handleSubmit = async (data: RegisterFormSchema) => {
    let toastId: string | number | undefined;

    try {
      toastId = toast.loading("Mendaftarkan akun...");
      console.log("Toast ID:", toastId);

      await register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success("Akun berhasil didaftarkan!", { id: toastId });
      router.push("/auth/login");
    } catch (error) {
      if (toastId) {
        toast.dismiss(toastId);
      }

      if (error instanceof Error) {
        setError("root", { message: error.message });
        toast.error(error.message);
      } else {
        const errorMessage =
          "Gagal mendaftarkan akun: Terjadi kesalahan tidak dikenal.";
        setError("root", { message: errorMessage });
        toast.error(errorMessage);
      }
    }
  };

  return (
    // <form onSubmit={handleSubmit}>
    <Form {...registerForm}>
      <form onSubmit={registerForm.handleSubmit(handleSubmit)}>
        <div className="flex flex-col gap-6">
          <div className="grid gap-3">
            <FormField
              control={registerForm.control}
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
              control={registerForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ahmad" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <FormField
              control={registerForm.control}
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
              control={registerForm.control}
              name="root"
              render={({ fieldState }) => (
                <FormMessage>{fieldState.error?.message}</FormMessage>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={
                registerForm.formState.isSubmitting || isPendingRegister
              }
            >
              Register
            </Button>
          </div>
        </div>
        <div className="mt-4 text-center text-sm">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="underline underline-offset-4">
            Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
