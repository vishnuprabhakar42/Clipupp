"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { AnalyticsDashboard as AnalyticsDashboardType } from "./AnalyticsDashboard";

/**
 * Code-split wrapper around the heavy Recharts-based dashboard. Pulling
 * recharts only when the dashboard route actually mounts keeps the rest of
 * the admin shell ~150 kB lighter.
 */
const AnalyticsDashboardInner = dynamic(
  () => import("./AnalyticsDashboard").then((m) => m.AnalyticsDashboard),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-card">
            <div className="h-full w-full animate-pulse rounded-lg bg-muted/40" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-lg border bg-card">
        <div className="h-full w-full animate-pulse rounded-lg bg-muted/40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 rounded-lg border bg-card">
            <div className="h-full w-full animate-pulse rounded-lg bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsDashboard(
  props: ComponentProps<typeof AnalyticsDashboardType>
) {
  return <AnalyticsDashboardInner {...props} />;
}
