import { create } from "zustand";
import { type CabangType } from "@/types/cabang.type";
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
