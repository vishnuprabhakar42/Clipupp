import { apiClient } from "./client";

export type AnalyticsSummary = {
  days: number;
  users: number;
  signupsInRange: number;
  clicksInRange: number;
  conversionsInRange: number;
  approvedConversionsInRange: number;
  commissionInRange: string;
  commissionCurrency: string;
  signupsToday: number;
  clicksToday: number;
  conversionsToday: number;
  topStoreName: string | null;
  topStoreClicks: number | null;
  topCouponTitle: string | null;
  topCouponClicks: number | null;
};

export type TimeseriesMetric = "clicks" | "conversions" | "signups";
export type TimeseriesPoint = { day: string; value: number };
export type TimeseriesResponse = {
  metric: TimeseriesMetric;
  days: number;
  points: TimeseriesPoint[];
};

export type TopStoreRow = {
  storeId: string;
  storeSlug: string;
  storeName: string;
  logoUrl: string | null;
  clicks: number;
  conversions: number;
  commission: string;
};

export type TopCouponRow = {
  couponId: string;
  couponSlug: string;
  couponTitle: string;
  storeSlug: string | null;
  storeName: string | null;
  clicks: number;
};

export type FunnelResponse = {
  days: number;
  clicks: number;
  conversionsAttempted: number;
  conversionsApproved: number;
  approvedCommission: string;
  commissionCurrency: string;
};

export type NetworkBreakdownRow = {
  networkId: string;
  networkCode: string;
  networkName: string;
  clicks: number;
  conversions: number;
  approvedConversions: number;
  commission: string;
};

function qs(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const analyticsApi = {
  summary: (days: number) =>
    apiClient.get<AnalyticsSummary>(`/api/v1/admin/analytics/summary${qs({ days })}`),
  timeseries: (metric: TimeseriesMetric, days: number) =>
    apiClient.get<TimeseriesResponse>(
      `/api/v1/admin/analytics/timeseries${qs({ metric, days })}`
    ),
  topStores: (limit: number) =>
    apiClient.get<TopStoreRow[]>(`/api/v1/admin/analytics/top-stores${qs({ limit })}`),
  topCoupons: (limit: number) =>
    apiClient.get<TopCouponRow[]>(`/api/v1/admin/analytics/top-coupons${qs({ limit })}`),
  funnel: (days: number) =>
    apiClient.get<FunnelResponse>(`/api/v1/admin/analytics/funnel${qs({ days })}`),
  byNetwork: (days: number) =>
    apiClient.get<NetworkBreakdownRow[]>(`/api/v1/admin/analytics/by-network${qs({ days })}`),
};

/** CSV escape helper used by dashboard exports. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(",")];
  for (const r of rows) lines.push(r.map(esc).join(","));
  return lines.join("\n");
}
