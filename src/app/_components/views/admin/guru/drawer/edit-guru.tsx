"use client";
import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { useGuruStore } from "@/store/useGuruStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  updateProfileFormSchema,
  type UpdateProfileFormSchema,
} from "@/types/user.type";
import { useUser } from "@/hooks/useUser";
import EditGuruForm from "../form/edit-guru-form";

export default function EditGuru() {
  const { isDrawerOpen, selectedGuru, closeDrawer, clearSelected } =
    useGuruStore();

  // useEffect(() => {
  //   if (selectedGuru) {
  //     editGuruForm.reset({
  //       name: selectedGuru.name ?? "",
  //       email: selectedGuru.email ?? "",
  //     });
  //   }
  // }, [selectedGuru]);

  const isOpen = isDrawerOpen("edit");

  const editGuruForm = useForm<UpdateProfileFormSchema>({
    resolver: zodResolver(updateProfileFormSchema),

    values: selectedGuru
      ? {
          name: selectedGuru.name ?? "",
          email: selectedGuru.email ?? "",
        }
      : undefined,
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const { mutations } = useUser({
    onSuccessUpdate: () => {
      closeDrawer();
      clearSelected();
      editGuruForm.reset();
    },
  });

  const handleSubmitEdit = async (data: UpdateProfileFormSchema) => {
    if (!selectedGuru) return;

    await mutations.update.mutateAsync({
      id: selectedGuru.id,
      ...data,
    });
  };

  return (
    <EditDrawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeDrawer()}
      title="Edit Guru"
      description="Ubah informasi guru yang sudah ada"
      onSubmit={editGuruForm.handleSubmit(handleSubmitEdit)}
      isPending={mutations.update.isPending}
      submitText="Simpan Perubahan"
      cancelText="Batal"
    >
      <Form {...editGuruForm}>
        <EditGuruForm onSubmit={handleSubmitEdit} />
      </Form>
    </EditDrawer>
  );
}
