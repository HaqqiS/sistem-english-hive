import { useState } from "react";
import { api } from "@/trpc/react";

export default function useCabangController() {
  const [selectedCabangId, setSelectedCabangId] = useState("all");

  const { data: dataCabang } = api.cabang.getAll.useQuery(undefined, {});

  const { data: dataRuang } = api.ruang.getRuangByCabangId.useQuery({
    cabangId: selectedCabangId,
  });

  return {
    dataCabang,
    dataRuang,
    selectedCabangId,
    setSelectedCabangId,
  };
}
