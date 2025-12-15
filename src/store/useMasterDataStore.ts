import { create } from "zustand";
import type { CabangType } from "@/types/cabang.type";
import type { TypeJamCustom, TypeJamTetap } from "@/types/jam.type";
import type { RuangType } from "@/types/ruang.type";

type DrawerType = "none" | "edit" | "tambah";

interface CabangStore {
	// Drawer management
	activeDrawer: DrawerType;
	selectedCabang: CabangType | null;

	// Action methods
	openDrawer: (drawer: DrawerType, cabang?: CabangType) => void;
	closeDrawer: () => void;

	// Helpers
	isDrawerOpen: (drawer: DrawerType) => boolean;
	clearSelected: () => void;
}

interface RuangStore {
	// Drawer management
	activeDrawer: DrawerType;
	selectedRuang: RuangType | null;

	// Action methods
	openDrawer: (drawer: DrawerType, ruang?: RuangType) => void;
	closeDrawer: () => void;

	// Helpers
	isDrawerOpen: (drawer: DrawerType) => boolean;
	clearSelected: () => void;
}

interface JamTetapStore {
	// Drawer management
	activeDrawer: DrawerType;
	selectedJam: TypeJamTetap | null;

	// Action methods
	openDrawer: (drawer: DrawerType, jam?: TypeJamTetap) => void;
	closeDrawer: () => void;

	// Helpers
	isDrawerOpen: (drawer: DrawerType) => boolean;
	clearSelected: () => void;
}

interface JamCustomStore {
	// Drawer management
	activeDrawer: DrawerType;
	selectedJam: TypeJamCustom | null;

	// Action methods
	openDrawer: (drawer: DrawerType, jam?: TypeJamCustom) => void;
	closeDrawer: () => void;

	// Helpers
	isDrawerOpen: (drawer: DrawerType) => boolean;
	clearSelected: () => void;
}

export const useCabangStore = create<CabangStore>((set, get) => ({
	activeDrawer: "none",
	selectedCabang: null,

	openDrawer: (drawer, cabang) =>
		set({
			activeDrawer: drawer,
			selectedCabang: cabang ?? null,
		}),

	closeDrawer: () => set({ activeDrawer: "none", selectedCabang: null }),

	isDrawerOpen: (drawer) => get().activeDrawer === drawer,

	clearSelected: () => set({ selectedCabang: null }),
}));

export const useRuangStore = create<RuangStore>((set, get) => ({
	activeDrawer: "none",
	selectedRuang: null,

	openDrawer: (drawer, ruang) =>
		set({
			activeDrawer: drawer,
			selectedRuang: ruang ?? null,
		}),
	closeDrawer: () => set({ activeDrawer: "none", selectedRuang: null }),

	isDrawerOpen: (drawer) => get().activeDrawer === drawer,

	clearSelected: () => set({ selectedRuang: null }),
}));

export const useJamTetapStore = create<JamTetapStore>((set, get) => ({
	activeDrawer: "none",
	selectedJam: null,

	openDrawer: (drawer, jam) =>
		set({
			activeDrawer: drawer,
			selectedJam: jam ?? null,
		}),
	closeDrawer: () => set({ activeDrawer: "none", selectedJam: null }),

	isDrawerOpen: (drawer) => get().activeDrawer === drawer,

	clearSelected: () => set({ selectedJam: null }),
}));

export const useJamCustomStore = create<JamCustomStore>((set, get) => ({
	activeDrawer: "none",
	selectedJam: null,

	openDrawer: (drawer, jam) =>
		set({
			activeDrawer: drawer,
			selectedJam: jam ?? null,
		}),
	closeDrawer: () => set({ activeDrawer: "none", selectedJam: null }),

	isDrawerOpen: (drawer) => get().activeDrawer === drawer,

	clearSelected: () => set({ selectedJam: null }),
}));
