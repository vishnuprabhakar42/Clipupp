"use client";

import { useEffect } from "react";
import type { SavedSeed } from "@/lib/home/savedSeed";
import { useSavedSheet } from "@/lib/home/useSavedSheet";

/**
 * Homepage only: hands the feed coupons, stores and categories (the same
 * objects the page already serialises, typed as the `SavedSeed` picks) to the
 * saved sheet so its rows render without a server round trip. Other routes
 * leave the seed empty and the sheet falls back to the `loadSavedRows` action.
 */
export function SavedSheetSeed({ seed }: { seed: SavedSeed }) {
  const set = useSavedSheet((s) => s.seed);
  useEffect(() => {
    set(seed);
  }, [set, seed]);
  return null;
}
