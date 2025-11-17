import type { RouterOutputs } from "@/trpc/react";
import { z } from "zod";

export type TypeGuruSimple = RouterOutputs["user"]["getAllGuruSimple"][number];
export type TypeGuruComplete =
  RouterOutputs["user"]["getAllGuruComplete"][number];

export const loginFormSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  root: z.string().optional(),
});

export const registerGuruFormSchema = loginFormSchema.extend({
  name: z.string().min(1, "Nama tidak boleh kosong"),
});

export const updateProfileFormSchema = registerGuruFormSchema.pick({
  name: true,
  email: true,
});

export const updatePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini harus diisi"),
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter")
      .regex(/[A-Z]/, "Kata sandi harus mengandung huruf besar")
      .regex(/[a-z]/, "Kata sandi harus mengandung huruf kecil")
      .regex(/[0-9]/, "Kata sandi harus mengandung angka"),
    confirmNewPassword: z.string().min(1, "Konfirmasi kata sandi harus diisi"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Kata sandi baru dan konfirmasi tidak sesuai",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini",
    path: ["newPassword"],
  });
export type LoginFormSchema = z.infer<typeof loginFormSchema>;

export type RegisterGuruFormSchema = z.infer<typeof registerGuruFormSchema>;

export type UpdateProfileFormSchema = z.infer<typeof updateProfileFormSchema>;

export type UpdatePasswordFormSchema = z.infer<typeof updatePasswordFormSchema>;
