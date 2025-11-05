import type { RouterOutputs } from "@/trpc/react";
import { z } from "zod";

export const getAbsensiByJadwalSesiIdSchema = z.object({
  jadwalSesiId: z.string(),
});

export type TypeAbsensiMurid =
  RouterOutputs["absenMurid"]["getAbsensiByJadwalSesiId"][number];
