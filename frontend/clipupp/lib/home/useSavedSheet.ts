import { create } from "zustand";

/** Open state for the single SavedSheet (header heart and bottom nav both open it). */
export const useSavedSheet = create<{ isOpen: boolean; open: () => void; close: () => void }>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
