"use client";

import { EditDrawer } from "@/app/_components/shared/edit-drawer";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMuridStore } from "@/store/useMuridStore";
import {
  RegisterMuridSchema,
  type TypeClientRegisterMuridSchema,
} from "@/types/murid.type";
import { useMurid } from "@/hooks/useMurid";
import MuridForm from "../form/murid-form";

export default function EditMurid() {
  const { isDrawerOpen, selectedMurid, closeDrawer, clearSelected } =
    useMuridStore();

  const form = useForm<TypeClientRegisterMuridSchema>({
    resolver: zodResolver(RegisterMuridSchema),
    values: selectedMurid
      ? {
          namaLengkap: selectedMurid.namaLengkap,
          email: selectedMurid.email,
          alamat: selectedMurid.alamat,
          gender: selectedMurid.gender,
          umur: selectedMurid.umur,
          asalSekolah: selectedMurid.asalSekolah,
          kelasSekolah: selectedMurid.kelasSekolah,
          jamPulang: selectedMurid.jamPulang,
          noWA: selectedMurid.noWA,
          cabangId: selectedMurid.cabangId,
          pilihanProgram: selectedMurid.pilihanProgram ?? "",
          sumberInfo: selectedMurid.sumberInfo,
          deskripsi: selectedMurid.deskripsi ?? "",
        }
      : undefined,
    defaultValues: {
      namaLengkap: "",
      email: "",
      alamat: "",
      gender: undefined,
      umur: undefined,
      asalSekolah: "",
      kelasSekolah: "",
      jamPulang: "",
      noWA: "",
      cabangId: "",
      pilihanProgram: "",
      sumberInfo: "",
      deskripsi: "",
    },
  });

  const isOpen = isDrawerOpen("edit");

  const { mutations } = useMurid({
    onSuccessUpdate: () => {
      closeDrawer();
      clearSelected();
      form.reset();
    },
  });

  const handleSubmitEdit = (data: TypeClientRegisterMuridSchema) => {
    if (!selectedMurid) return;
    mutations.update.mutate({
      id: selectedMurid.id,
      ...data,
    });
  };

  const isPending = mutations.update?.isPending;

  return (
    <EditDrawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeDrawer()}
      title="Edit Data Murid"
      description="Ubah informasi murid yang sudah ada"
      onSubmit={form.handleSubmit(handleSubmitEdit)}
      isPending={isPending}
      submitText="Simpan Perubahan"
      cancelText="Batal"
    >
      <Form {...form}>
        <MuridForm
          onSubmit={handleSubmitEdit}
          idPrefix="admin-edit-murid"
          forceStacked={true}
        />
      </Form>
    </EditDrawer>
  );
}
