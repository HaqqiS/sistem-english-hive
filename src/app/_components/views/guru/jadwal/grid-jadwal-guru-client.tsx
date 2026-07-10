"use client";

import JadwalGuruTab from "@/app/_components/views/admin/guru/tabs/jadwal-guru-tab";
import { useGlobalCabangStore } from "@/store/useGlobalCabangStore";

export default function GuruGridJadwalClient() {
	const { activeCabangId } = useGlobalCabangStore();

	return <JadwalGuruTab cabangId={activeCabangId} />;
}
