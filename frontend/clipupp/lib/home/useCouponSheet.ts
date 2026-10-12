import { create } from "zustand";
import type { FeedCoupon, FeedStore } from "./feed";

type CouponSheetState = {
  coupon: FeedCoupon | null;
  store: FeedStore | null;
  category: { name: string } | null;
  isOpen: boolean;
  open: (coupon: FeedCoupon, store: FeedStore, category?: { name: string } | null) => void;
  close: () => void;
};

/** Drives the single CouponSheet mounted in the public layout. */
export const useCouponSheet = create<CouponSheetState>((set) => ({
  coupon: null,
  store: null,
  category: null,
  isOpen: false,
  open: (coupon, store, category = null) => set({ coupon, store, category, isOpen: true }),
  // Keep coupon/store so the sheet content does not blank during the close.
  close: () => set({ isOpen: false }),
}));
