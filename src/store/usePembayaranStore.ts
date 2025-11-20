import { create } from "zustand";
import type { PembayaranData } from "@/hooks/usePembayaran";

type DrawerType = "none" | "edit" | "create";

interface PembayaranStore {
  activeDrawer: DrawerType;
  selectedPembayaran: PembayaranData | null;

  openDrawer: (drawer: DrawerType, item?: PembayaranData) => void;
  closeDrawer: () => void;

  isDrawerOpen: (drawer: DrawerType) => boolean;
  clearSelected: () => void;
}

export const usePembayaranStore = create<PembayaranStore>((set, get) => ({
  activeDrawer: "none",
  selectedPembayaran: null,

  openDrawer: (drawer, item) =>
    set({
      activeDrawer: drawer,
      selectedPembayaran: item ?? null,
    }),

  closeDrawer: () => set({ activeDrawer: "none", selectedPembayaran: null }),

  isDrawerOpen: (drawer) => get().activeDrawer === drawer,

  clearSelected: () => set({ selectedPembayaran: null }),
}));
