"use client";

import { AddDrawer } from "@/app/_components/shared/add-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  registerGuruFormSchema,
  type RegisterGuruFormSchema,
} from "@/types/user.type";
import { useUser } from "@/hooks/useUser";
import RegisterForm from "@/app/auth/register/form-register";

export default function RegistrasiGuru() {
  const [isOpen, setIsOpen] = useState(false);

  const registrationForm = useForm<RegisterGuruFormSchema>({
    resolver: zodResolver(registerGuruFormSchema),
    defaultValues: {},
  });

  const { mutations: registrationMutations } = useUser({
    onSuccessCreate: () => {
      setIsOpen(false);
      registrationForm.reset();
    },
  });

  const onSubmit = (values: RegisterGuruFormSchema) => {
    registrationMutations.registration.mutate(values);
  };

  return (
    <AddDrawer
      title="Buat Akun Guru Baru"
      description="Tambahkan akun guru baru ke dalam sistem."
      onSubmit={registrationForm.handleSubmit(onSubmit)}
      isPending={registrationMutations.registration.isPending}
      submitText="Tambah Guru Baru"
      cancelText="Batal"
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Akun Guru
        </Button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Form {...registrationForm}>
        <RegisterForm onSubmit={onSubmit} />
      </Form>
    </AddDrawer>
  );
}
