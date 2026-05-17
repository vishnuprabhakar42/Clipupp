"use client";

import { useReportWebVitals } from "next/web-vitals";
import { readConsent } from "@/lib/cookies/consent";

const ENDPOINT = "/api/v1/web-vitals"; // Phase-2 backend ingestion endpoint

/**
 * Reports Core Web Vitals to the backend (Phase 2 receiver) and the dev
 * console. Only reports when the user has granted analytics consent —
 * GDPR-respecting by default.
 *
 * Phase 1: console only. The {@code ENDPOINT} fetch is wrapped in keepalive
 * `navigator.sendBeacon` when the route is supported so it does not block
 * unload. Backend ingestion will be wired in Sprint 7+.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const consent = typeof window !== "undefined" ? readConsent() : null;
    if (!consent?.analytics) return;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const payload = JSON.stringify({
      name: metric.name,
      id: metric.id,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      ts: Date.now(),
    });

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[web-vitals]", metric.name, metric.value, metric.rating);
    }

    if (!apiBase) return;
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          `${apiBase}${ENDPOINT}`,
          new Blob([payload], { type: "application/json" })
        );
        return;
      }
      void fetch(`${apiBase}${ENDPOINT}`, {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Telemetry must never break the user — silently drop on transport failure.
    }
  });
  return null;
}
