"use client";

import dynamic from "next/dynamic";

/*
 * Closed-by-default overlays, split out of the first-load bundle. Each one is
 * mounted by its trigger only after the first open; the openers keep their
 * state in zustand stores, so nothing is lost while a chunk loads.
 */
export const LazyCouponSheet = dynamic(() => import("@/features/catalog/components/CouponSheet").then((m) => m.CouponSheet), { ssr: false, loading: () => null });
export const LazySavedSheet = dynamic(() => import("@/features/home/components/SavedSheet").then((m) => m.SavedSheet), { ssr: false, loading: () => null });
export const LazyCategoriesMenuPanel = dynamic(() => import("@/components/site/CategoriesMenuPanel").then((m) => m.CategoriesMenuPanel), { ssr: false, loading: () => null });
