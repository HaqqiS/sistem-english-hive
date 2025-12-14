import type { RouterOutputs } from "@/trpc/react";
import {
  clientSesiPertemuanSchema,
  serverSesiPertemuanSchema,
  type TypeClientSesiPertemuanSchema,
} from "./sesiPertemuan.schema";

export type TypeSesiSummary =
  RouterOutputs["sesiPertemuan"]["getSesiSummaryByKelasId"];

export type TypeSesiSummaryRowData = TypeSesiSummary["rowData"][number];

export {
  clientSesiPertemuanSchema,
  serverSesiPertemuanSchema,
  type TypeClientSesiPertemuanSchema,
};
