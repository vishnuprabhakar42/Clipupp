"use client";

import { useCallback, useEffect, useState } from "react";

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

/**
 * Coupon ids whose code the visitor has revealed, persisted in localStorage.
 * Empty on the server and first client render, filled in an effect.
 */
export function useRevealed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
  }, []);

  const isRevealed = useCallback((id: string) => ids.includes(id), [ids]);

  const markRevealed = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        // Merge with storage so other tabs' reveals are not lost.
        const merged = Array.from(new Set([...read(), ...next]));
        localStorage.setItem(KEY, JSON.stringify(merged));
      } catch {}
      return next;
    });
  }, []);

  return { isRevealed, markRevealed };
}
