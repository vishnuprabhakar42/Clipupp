"use client";

import { useCallback, useEffect } from "react";
import { create } from "zustand";

const KEY = "clipupp:revealed";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

type RevealedState = {
  ids: string[];
  hydrated: boolean;
  hydrate: () => void;
  add: (id: string) => void;
};

/** Shared across every hook instance so all cards for a coupon reveal together. */
const useRevealedStore = create<RevealedState>((set, get) => ({
  ids: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ ids: Array.from(new Set([...read(), ...get().ids])), hydrated: true });
  },
  add: (id) => {
    if (get().ids.includes(id)) return;
    const ids = [...get().ids, id];
    set({ ids });
    try {
      // Merge with storage so other tabs' reveals are not lost.
      localStorage.setItem(KEY, JSON.stringify(Array.from(new Set([...read(), ...ids]))));
    } catch {}
  },
}));

/**
 * Coupon ids whose code the visitor has revealed, persisted in localStorage.
 * Empty on the server and first client render, filled in an effect.
 */
export function useRevealed() {
  const ids = useRevealedStore((s) => s.ids);
  const hydrate = useRevealedStore((s) => s.hydrate);
  const add = useRevealedStore((s) => s.add);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isRevealed = useCallback((id: string) => ids.includes(id), [ids]);
  return { isRevealed, markRevealed: add };
}
