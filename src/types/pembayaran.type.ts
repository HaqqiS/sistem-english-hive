import type { RouterOutputs } from "@/trpc/react";

export type TypePembayaran = RouterOutputs["pembayaran"]["getAll"][number];
export type TypePembayaranJatuhTempo =
  RouterOutputs["pembayaran"]["getTagihanJatuhTempo"][number];
