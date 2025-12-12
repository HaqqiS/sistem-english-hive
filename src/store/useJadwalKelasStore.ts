import { create } from "zustand";
import { type TypeJadwalKelas } from "@/types/jadwalKelas.type";

type DrawerType = "none" | "edit" | "tambah";

interface JadwalKelasStore {
  // Drawer management
  activeDrawer: DrawerType;
  selectedJadwalKelas: TypeJadwalKelas | null;

  // Action methods
  openDrawer: (drawer: DrawerType, jadwalKelas?: TypeJadwalKelas) => void;
  closeDrawer: () => void;

  // Helpers
  isDrawerOpen: (drawer: DrawerType) => boolean;
  clearSelected: () => void;
}

export const useJadwalKelasStore = create<JadwalKelasStore>((set, get) => ({
  activeDrawer: "none",
  selectedJadwalKelas: null,

  openDrawer: (drawer, absenGuru) =>
    set({
      activeDrawer: drawer,
      selectedJadwalKelas: absenGuru ?? null,
    }),

  closeDrawer: () => set({ activeDrawer: "none", selectedJadwalKelas: null }),
  isDrawerOpen: (drawer) => get().activeDrawer === drawer,

  clearSelected: () => set({ selectedJadwalKelas: null }),
}));
