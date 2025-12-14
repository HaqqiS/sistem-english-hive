import { create } from "zustand";

interface GlobalCabangState {
	activeCabangId: string;
	setActiveCabangId: (cabangId: string) => void;
}

export const useGlobalCabangStore = create<GlobalCabangState>((set) => ({
	activeCabangId: "ALL",
	setActiveCabangId: (cabangId) => set({ activeCabangId: cabangId }),
}));
