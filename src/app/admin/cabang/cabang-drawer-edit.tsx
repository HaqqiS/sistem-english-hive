"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/app/_components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/app/_components/ui/drawer";
import type { CabangType, TypeClientCabangSchema } from "@/types/cabang.type";
import { Form } from "@/app/_components/ui/form";
import { type useForm } from "react-hook-form";
import CabangForm from "./cabang-form";

// export function PemasukanEditDrawer
// ({ item }: { item: z.infer<typeof schema> }) {
export function CabangEditDrawer({
  isOpen,
  setIsOpen,
  form,
  handleSubmitEditCabang,
  isPending,
  // children,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  form: ReturnType<typeof useForm<TypeClientCabangSchema>>;
  handleSubmitEditCabang: (data: TypeClientCabangSchema) => void;
  isPending: boolean;
  // children?: ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      open={isOpen} // Status buka/tutup dikontrol dari luar
      onOpenChange={setIsOpen} // Cara menutup juga dikontrol dari luar
    >
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Detail Pemasukan</DrawerTitle>
          <DrawerDescription>menampilkan rincian pemasukan</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <Form {...form}>
            <CabangForm onSubmit={handleSubmitEditCabang} />
          </Form>
          {/* {children} */}
        </div>
        <DrawerFooter>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmitEditCabang)}
            disabled={isPending}
          >
            Submit
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
