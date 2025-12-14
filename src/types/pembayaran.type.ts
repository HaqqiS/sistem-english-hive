import type { RouterOutputs } from "@/trpc/react";
import {
  clientCreatePembayaranSchema,
  clientUpdatePembayaranSchema,
  createPembayaranSchema,
  updatePembayaranSchema,
  type TypeClientCreatePembayaranSchema,
  type TypeClientUpdatePembayaranSchema,
  type TypeUpdatePembayaranSchema,
} from "./pembayaran.schema";

export type TypePembayaran =
  RouterOutputs["pembayaran"]["getAllPaginated"]["data"][number];
export type TypePembayaranPaginated =
  RouterOutputs["pembayaran"]["getAllPaginated"];
export type TypePembayaranJatuhTempo =
  RouterOutputs["pembayaran"]["getTagihanJatuhTempo"][number];
export type SaldoSiswaData = RouterOutputs["pembayaran"]["getSaldoByMuridId"];

export {
  clientCreatePembayaranSchema,
  clientUpdatePembayaranSchema,
  createPembayaranSchema,
  updatePembayaranSchema,
  type TypeClientCreatePembayaranSchema,
  type TypeClientUpdatePembayaranSchema,
  type TypeUpdatePembayaranSchema,
};
