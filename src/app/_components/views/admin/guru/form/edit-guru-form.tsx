"use client";
import { useFormContext } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UpdateProfileFormSchema } from "@/types/user.type";

interface EditGuruFormProps {
	onSubmit: (data: UpdateProfileFormSchema) => void;
}

export default function EditGuruForm({ onSubmit }: EditGuruFormProps) {
	// HOOK FORMS
	const form = useFormContext<UpdateProfileFormSchema>();

	// const { setError } = form;

	//MUTATIONS
	// const { mutateAsync: register, isPending: isPendingRegister } =
	//   api.user.registerPengurus.useMutation();

	//HANDLERS

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<div className="flex flex-col gap-6">
				<div className="grid gap-3">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="guru@mail.com"
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
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="Guru Name" {...field} required />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex flex-col gap-3">
					{/* <FormField
            control={form.control}
            name="root"
            render={({ fieldState }) => (
              <FormMessage>{fieldState.error?.message}</FormMessage>
            )}
          /> */}
					{/* <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            Register
          </Button> */}
				</div>
			</div>
			{/* <div className="mt-4 text-center text-sm">
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="underline underline-offset-4">
          Login
        </Link>
      </div> */}
		</form>
	);
}
