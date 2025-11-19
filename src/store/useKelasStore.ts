import type { TypeHistoryGuruKelas } from "@/types/historyGuruKelas.type";
import type { TypeKelas } from "@/types/kelas.type";
import type { PendaftaranKelasType } from "@/types/pendaftaranKelas.type";
import { create } from "zustand";

type DrawerType = "none" | "edit" | "tambah" | "upLevel";

interface KelasStore {
  // Drawer management
  activeDrawer: DrawerType;
  selectedKelas: TypeKelas | null;

  // Action methods
  openDrawer: (drawer: DrawerType, kelas?: TypeKelas) => void;
  closeDrawer: () => void;

  // Helpers
  isDrawerOpen: (drawer: DrawerType) => boolean;
  clearSelected: () => void;
}

interface GuruKelasStore {
  // Drawer management
  activeDrawer: DrawerType;
  selectedHistoryGuruKelas: TypeHistoryGuruKelas | null;

  // Action methods
  openDrawer: (drawer: DrawerType, kelas?: TypeHistoryGuruKelas) => void;
  closeDrawer: () => void;

  // Helpers
  isDrawerOpen: (drawer: DrawerType) => boolean;
  clearSelected: () => void;
}

interface PendaftaranKelasStore {
  // Drawer management
  activeDrawer: DrawerType;
  selectedPendaftaran: PendaftaranKelasType | null;

  // Action methods
  openDrawer: (drawer: DrawerType, pendaftaran?: PendaftaranKelasType) => void;
  closeDrawer: () => void;

  // Helpers
  isDrawerOpen: (drawer: DrawerType) => boolean;
  clearSelected: () => void;
}

export const useKelasStore = create<KelasStore>((set, get) => ({
  activeDrawer: "none",
  selectedKelas: null,

  openDrawer: (drawer, kelas) =>
    set({
      activeDrawer: drawer,
      selectedKelas: kelas ?? null,
    }),

  closeDrawer: () => set({ activeDrawer: "none", selectedKelas: null }),

  isDrawerOpen: (drawer) => get().activeDrawer === drawer,

  clearSelected: () => set({ selectedKelas: null }),
}));

export const useGuruKelasStore = create<GuruKelasStore>((set, get) => ({
  activeDrawer: "none",
  selectedHistoryGuruKelas: null,

  openDrawer: (drawer, kelas) =>
    set({
      activeDrawer: drawer,
      selectedHistoryGuruKelas: kelas ?? null,
    }),

  closeDrawer: () =>
    set({ activeDrawer: "none", selectedHistoryGuruKelas: null }),

  isDrawerOpen: (drawer) => get().activeDrawer === drawer,

  clearSelected: () => set({ selectedHistoryGuruKelas: null }),
}));

export const usePendaftaranKelasStore = create<PendaftaranKelasStore>(
  (set, get) => ({
    activeDrawer: "none",
    selectedPendaftaran: null,

    openDrawer: (drawer, pendaftaran) =>
      set({
        activeDrawer: drawer,
        selectedPendaftaran: pendaftaran ?? null,
      }),
    closeDrawer: () => set({ activeDrawer: "none" }),

    isDrawerOpen: (drawer) => get().activeDrawer === drawer,

    clearSelected: () => set({ selectedPendaftaran: null }),
  }),
);
