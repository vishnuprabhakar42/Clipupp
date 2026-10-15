import { create } from "zustand";
import type { FeedCoupon, FeedStore } from "./feed";

type CouponSheetState = {
  coupon: FeedCoupon | null;
  store: FeedStore | null;
  category: { name: string } | null;
  isOpen: boolean;
  /** Increments on every open so the sheet body remounts and its effects rerun. */
  seq: number;
  /** Pending clipboard write started by the opener inside its own click gesture, null when none. */
  copy: Promise<void> | null;
  open: (
    coupon: FeedCoupon,
    store: FeedStore,
    category?: { name: string } | null,
    opts?: { copy?: Promise<void> | null },
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
  copy: null,
  open: (coupon, store, category = null, opts) =>
    set((s) => ({ coupon, store, category, isOpen: true, seq: s.seq + 1, copy: opts?.copy ?? null })),
  // Keep coupon/store so the sheet content does not blank during the close.
  close: () => set({ isOpen: false }),
}));
