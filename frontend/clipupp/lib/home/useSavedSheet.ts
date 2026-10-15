import { create } from "zustand";
import type { SavedSeed } from "./savedSeed";

type Seed = SavedSeed;

type SavedSheetState = Seed & {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Homepage feed slices (`SavedSheetSeed`, typed as `SavedSeed`) so saved rows render without a fetch. */
  seed: (seed: SavedSeed) => void;
  /** Saved ids the last `loadSavedRows` could not render (the badge leaves them out for guests). */
  unresolved: string[];
  setUnresolved: (ids: string[]) => void;
};

/** Open state and feed seed for the single SavedSheet (header heart and bottom nav both open it). */
export const useSavedSheet = create<SavedSheetState>((set) => ({
  isOpen: false,
  coupons: [],
  stores: [],
  categories: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  seed: ({ coupons, stores, categories }) => set({ coupons, stores, categories }),
  unresolved: [],
  setUnresolved: (unresolved) => set({ unresolved }),
}));
