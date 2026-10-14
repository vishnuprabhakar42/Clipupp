"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const REPORTS_KEY = "clipupp:reports";

export type ReportReason = "expired" | "invalid" | "min_order" | "other";
export type CouponReport = { reason: ReportReason; at: number };

type ReportsState = {
  /** couponId -> the visitor's latest "not working" report. */
  reports: Record<string, CouponReport>;
  /** Records (or replaces) the report for a coupon. `at` defaults to now. */
  report: (couponId: string, reason: ReportReason, at?: number) => void;
  get: (couponId: string) => CouponReport | null;
};

export const useReportsStore = create<ReportsState>()(
  persist(
    (set, get) => ({
      reports: {},
      report: (couponId, reason, at = Date.now()) =>
        set({ reports: { ...get().reports, [couponId]: { reason, at } } }),
      get: (couponId) => get().reports[couponId] ?? null,
    }),
    {
      name: REPORTS_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ reports: s.reports }),
      // Hydrate in an effect so SSR markup and the first client render agree.
      skipHydration: true,
    },
  ),
);

let hydrationStarted = false;

/**
 * "Report not working" reasons the visitor sent, kept on this device
 * (localStorage `clipupp:reports`) until the feedback API ships. Returns the
 * report for `couponId` (null until hydrated or when there is none) and `report`.
 */
export function useReports(couponId: string) {
  const current = useReportsStore((s) => s.reports[couponId] ?? null);
  const report = useReportsStore((s) => s.report);
  useEffect(() => {
    if (hydrationStarted) return;
    hydrationStarted = true;
    void useReportsStore.persist.rehydrate();
  }, []);
  return { current, report: (reason: ReportReason) => report(couponId, reason) };
}
