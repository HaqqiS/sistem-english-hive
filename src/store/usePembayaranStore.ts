import { create } from "zustand";
import type { TypePembayaran } from "@/types/pembayaran.type";

type DrawerType = "none" | "edit" | "create";

interface PembayaranStore {
	activeDrawer: DrawerType;
	selectedPembayaran: TypePembayaran | null;

	openDrawer: (drawer: DrawerType, item?: TypePembayaran) => void;
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
