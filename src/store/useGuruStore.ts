import { create } from "zustand";
import type { TypeAbsensiGuru } from "@/types/absenGuru.type";
import type { TypeGuruComplete } from "@/types/user.type";

type DrawerType = "none" | "edit" | "tambah";

interface AbsenGuruStore {
	// Drawer management
	activeDrawer: DrawerType;
	selectedAbsenGuru: TypeAbsensiGuru | null;

	// Action methods
	openDrawer: (drawer: DrawerType, absenGuru?: TypeAbsensiGuru) => void;
	closeDrawer: () => void;

	// Helpers
	isDrawerOpen: (drawer: DrawerType) => boolean;
	clearSelected: () => void;
}

export const useAbsenGuruStore = create<AbsenGuruStore>((set, get) => ({
	activeDrawer: "none",
	selectedAbsenGuru: null,

	openDrawer: (drawer, absenGuru) =>
		set({
			activeDrawer: drawer,
			selectedAbsenGuru: absenGuru ?? null,
		}),

	closeDrawer: () => set({ activeDrawer: "none", selectedAbsenGuru: null }),
	isDrawerOpen: (drawer) => get().activeDrawer === drawer,

	clearSelected: () => set({ selectedAbsenGuru: null }),
}));

interface GuruStore {
	// Drawer management
	activeDrawer: DrawerType;
	selectedGuru: TypeGuruComplete | null;

	// Action methods
	openDrawer: (drawer: DrawerType, guru?: TypeGuruComplete) => void;
	closeDrawer: () => void;

	// Helpers
	isDrawerOpen: (drawer: DrawerType) => boolean;
	clearSelected: () => void;
}

export const useGuruStore = create<GuruStore>((set, get) => ({
	activeDrawer: "none",
	selectedGuru: null,

	openDrawer: (drawer, guru) =>
		set({
			activeDrawer: drawer,
			selectedGuru: guru ?? null,
		}),

	closeDrawer: () => set({ activeDrawer: "none", selectedGuru: null }),
	isDrawerOpen: (drawer) => get().activeDrawer === drawer,

	clearSelected: () => set({ selectedGuru: null }),
}));
