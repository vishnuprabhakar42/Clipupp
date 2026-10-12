import { create } from "zustand";
import type { FeedCoupon, FeedStore } from "./feed";

type Seed = { coupons: FeedCoupon[]; stores: FeedStore[]; categories: { id: string; name: string }[] };

type SavedSheetState = Seed & {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Homepage feed slices the header passes down so saved rows render without a fetch. */
  seed: (coupons: FeedCoupon[], stores: FeedStore[], categories: { id: string; name: string }[]) => void;
};

/** Open state and feed seed for the single SavedSheet (header heart and bottom nav both open it). */
export const useSavedSheet = create<SavedSheetState>((set) => ({
  isOpen: false,
  coupons: [],
  stores: [],
  categories: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  seed: (coupons, stores, categories) => set({ coupons, stores, categories }),
}));
