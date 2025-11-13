import type { RouterOutputs } from "@/trpc/react";
import dayjs from "dayjs";
import z from "zod";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export type TypeJamTetap = RouterOutputs["jam"]["getAllJamTetap"][number];
export type TypeJamCustom = RouterOutputs["jam"]["getAllJamCustom"][number];

// keep the raw object schema so it can be extended for server usage
const baseJamObject = z.object({
  cabangId: z.string().min(1, "Cabang harus dipilih"),
  namaSlot: z.string().min(1).max(50),
  jamMulai: z
    .string()
    .min(1)
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Format jam harus HH:MM (contoh: 09:00)",
    }),
  jamSelesai: z
    .string()
    .min(1)
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Format jam harus HH:MM (contoh: 10:30)",
    }),
});

const jamRefine = <T extends { jamMulai: string; jamSelesai: string }>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  // 1. Parse string "HH:MM" menjadi objek Dayjs
  const tMulai = dayjs(data.jamMulai, "HH:mm");
  const tSelesai = dayjs(data.jamSelesai, "HH:mm");

  // console.log("isValid: ", !tMulai.isValid() || !tSelesai.isValid());

  if (!tMulai.isValid() || !tSelesai.isValid()) {
    return;
  }

  // console.log(tSelesai.isBefore(tMulai) || tSelesai.isSame(tMulai));
  if (tSelesai.isBefore(tMulai) || tSelesai.isSame(tMulai)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jam selesai harus setelah jam mulai",
      path: ["jamSelesai"], // Tampilkan error di field jamSelesai
    });
    return; // Hentikan validasi lebih lanjut
  }

  const durasiMenit = tSelesai.diff(tMulai, "minute");
  // console.log("durasi menit: ", durasiMenit);

  if (durasiMenit !== 90) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Durasi harus 90 menit. (Saat ini: ${durasiMenit} menit)`,
      path: ["jamSelesai"],
    });
    return;
  }
};

export const clientJamSchema = baseJamObject.superRefine(jamRefine);

export type TypeClientJamTetapSchema = z.infer<typeof clientJamSchema>;

export const clientJamCustomSchema = baseJamObject
  .omit({
    cabangId: true,
    namaSlot: true,
  })
  .superRefine(jamRefine);

export type TypeClientJamCustomSchema = z.infer<typeof clientJamCustomSchema>;

export const serverJamSchema = baseJamObject.extend({
  id: z.string().min(1, "ID Jam harus diisi"),
});

export type TypeServerJamSchema = z.infer<typeof serverJamSchema>;
