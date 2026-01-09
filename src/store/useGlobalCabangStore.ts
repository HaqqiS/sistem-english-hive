import Cookies from "js-cookie";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface GlobalCabangState {
	activeCabangId: string;
	setActiveCabangId: (cabangId: string) => void;
}

export const useGlobalCabangStore = create<GlobalCabangState>()(
	persist(
		(set) => ({
			activeCabangId: "ALL",
			setActiveCabangId: (cabangId) => set({ activeCabangId: cabangId }),
		}),
		{
			name: "cabang_storage",
			storage: createJSONStorage(() => ({
				getItem: (name) => {
					return Cookies.get(name) || null;
				},
				setItem: (name, value) => {
					Cookies.set(name, value, { expires: 7, path: "/" });
				},
				removeItem: (name) => {
					Cookies.remove(name);
				},
			})),
		},
	),
);
