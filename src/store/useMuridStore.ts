import { create } from "zustand";
import type { TypeAllMurid } from "@/types/murid.type";

type DrawerType = "none" | "edit" | "tambah" | "edit-status";

interface MuridStore {
	// Drawer management
	activeDrawer: DrawerType;
	selectedMurid: TypeAllMurid | null;

	// Action methods
	openDrawer: (drawer: DrawerType, murid?: TypeAllMurid) => void;
	closeDrawer: () => void;

	// Helpers
	isDrawerOpen: (drawer: DrawerType) => boolean;
	clearSelected: () => void;
}

export const useMuridStore = create<MuridStore>((set, get) => ({
	activeDrawer: "none",
	selectedMurid: null,

	openDrawer: (drawer, murid) =>
		set({
			activeDrawer: drawer,
			selectedMurid: murid ?? null,
		}),

	closeDrawer: () => set({ activeDrawer: "none", selectedMurid: null }),

	isDrawerOpen: (drawer) => get().activeDrawer === drawer,

	clearSelected: () => set({ selectedMurid: null }),
}));
