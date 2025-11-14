import type { RouterOutputs } from "@/trpc/react";
import { Gender } from "@prisma/client";
import z from "zod";

export type TypeMuridNotRegistered =
  RouterOutputs["murid"]["getMuridWhereNotRegistered"][number];

export const RegisterMuridSchema = z.object({
  namaLengkap: z.string().trim().min(1, "Nama lengkap harus diisi").max(200),
  email: z
    .string()
    .trim()
    .toLowerCase() // Standarisasi email menjadi lowercase
    .email("Email tidak valid")
    .max(200),

  alamat: z.string().trim().min(1, "Alamat harus diisi").max(500),
  gender: z.enum([Gender.LAKI_LAKI, Gender.PEREMPUAN], {
    required_error: "Jenis kelamin harus dipilih.", // Pesan jika 'undefined'
  }),
  umur: z.coerce.number().min(3, "Umur minimal 3 tahun").max(100),
  asalSekolah: z.string().trim().min(1, "Asal sekolah harus diisi").max(200),
  kelasSekolah: z.string().trim().min(1, "Kelas harus diisi").max(20),
  jamPulang: z.string().trim().min(1, "Jam pulang harus diisi").max(225),
  noWA: z
    .string()
    .trim()
    .min(10, "No. WA minimal 10 digit")
    .max(15, "No. WA maksimal 15 karakter")
    // Regex ini memvalidasi:
    // - Dimulai dengan '08' (cth: 0812...)
    // - ATAU dimulai dengan '+628' (cth: +62812...)
    .regex(/^(\+?62|0)8[0-9]{8,12}$/, {
      message: "No. WA tidak valid (cth: 0812... atau +62812...)",
    })
    // Transformasi: Ubah '08...' atau '+628...' menjadi '628...'
    // agar format di database seragam (tanpa '+').
    .transform((val) => {
      if (val.startsWith("0")) {
        return `62${val.substring(1)}`;
      }
      if (val.startsWith("+")) {
        return val.substring(1); // Hapus '+'
      }
      return val;
    }),
  cabangId: z.string().min(1, "Tempat kursus harus dipilih"),
  pilihanProgram: z.string().min(1, "Pilihan program harus diisi").max(100),
  sumberInfo: z.string().min(1, "Sumber informasi harus diisi").max(100),
});

export type TypeClientRegisterMuridSchema = z.infer<typeof RegisterMuridSchema>;
