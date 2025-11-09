import type { RouterOutputs } from "@/trpc/react";
import { Gender } from "@prisma/client";
import z from "zod";

export type TypeMuridNotRegistered =
  RouterOutputs["murid"]["getMuridWhereNotRegistered"][number];

export const RegisterMuridSchema = z.object({
  namaLengkap: z.string().min(1, "Nama lengkap harus diisi").max(200),
  email: z.string().email("Email tidak valid").max(200),
  alamat: z.string().min(1, "Alamat harus diisi").max(500),
  gender: z.enum([Gender.LAKI_LAKI, Gender.PEREMPUAN]),
  umur: z.coerce.number().min(1, "Umur harus diisi").max(100),
  asalSekolah: z.string().min(1, "Asal sekolah harus diisi").max(200),
  kelasSekolah: z.string().min(1, "Kelas harus diisi").max(20),
  jamPulang: z.string().min(1, "Jam pulang harus diisi").max(225),
  noWA: z
    .string()
    .min(1, "No Telepon harus diisi")
    .max(15, "No Telepon maksimal 15 karakter")
    .regex(/^\+?[0-9]*$/, { message: "No Telepon tidak valid" }),
  cabangId: z.string().min(1, "Tempat kursus harus dipilih"),
  pilihanProgram: z.string().min(1, "Pilihan program harus diisi").max(100),
  sumberInfo: z.string().min(1, "Sumber informasi harus diisi").max(100),
});

export type TypeClientRegisterMuridSchema = z.infer<typeof RegisterMuridSchema>;
