"use client";

import dynamic from "next/dynamic";
import { retryImport } from "@/lib/lazy/retryImport";

/*
 * Closed-by-default overlays, split out of the first-load bundle. Each one is
 * mounted by its trigger only after the first open; the openers keep their
 * state in zustand stores, so nothing is lost while a chunk loads. Loaders
 * retry a failed import, and each mount point wraps its island in
 * `LazyBoundary` so a chunk that never arrives drops the overlay, not the page.
 */
export const LazyCouponSheet = dynamic(
  () => retryImport(() => import("@/features/catalog/components/CouponSheet")).then((m) => m.CouponSheet),
  { ssr: false, loading: () => null },
);
export const LazySavedSheet = dynamic(
  () => retryImport(() => import("@/features/home/components/SavedSheet")).then((m) => m.SavedSheet),
  { ssr: false, loading: () => null },
);
export const LazyCategoriesMenuPanel = dynamic(
  () => retryImport(() => import("@/components/site/CategoriesMenuPanel")).then((m) => m.CategoriesMenuPanel),
  { ssr: false, loading: () => null },
);
