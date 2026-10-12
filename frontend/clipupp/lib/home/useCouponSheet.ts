import { create } from "zustand";
import type { FeedCoupon, FeedStore } from "./feed";

type CouponSheetState = {
  coupon: FeedCoupon | null;
  store: FeedStore | null;
  category: { name: string } | null;
  isOpen: boolean;
  /** Increments on every open so the sheet body remounts and its effects rerun. */
  seq: number;
  /** True when the opener already copied the code inside its own click gesture. */
  copied: boolean;
  open: (
    coupon: FeedCoupon,
    store: FeedStore,
    category?: { name: string } | null,
    opts?: { copied?: boolean },
  ) => void;
  close: () => void;
};

/** Drives the single CouponSheet mounted in the public layout. */
export const useCouponSheet = create<CouponSheetState>((set) => ({
  coupon: null,
  store: null,
  category: null,
  isOpen: false,
  seq: 0,
  copied: false,
  open: (coupon, store, category = null, opts) =>
    set((s) => ({ coupon, store, category, isOpen: true, seq: s.seq + 1, copied: !!opts?.copied })),
  // Keep coupon/store so the sheet content does not blank during the close.
  close: () => set({ isOpen: false }),
}));
