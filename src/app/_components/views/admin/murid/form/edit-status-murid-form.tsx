"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusMurid } from "@prisma/client";
import type { TypeUpdateStatusMuridSchema } from "@/types/murid.type";

// Simple schema for status update

interface EditStatusMuridFormProps {
  onSubmit: (data: TypeUpdateStatusMuridSchema) => void;
}

export default function EditStatusMuridForm({
  onSubmit,
}: EditStatusMuridFormProps) {
  const form = useFormContext<TypeUpdateStatusMuridSchema>();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="statusMurid"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status Murid</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={StatusMurid.AKTIF}>Aktif</SelectItem>
                <SelectItem value={StatusMurid.NON_AKTIF}>Non-Aktif</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  );
}
