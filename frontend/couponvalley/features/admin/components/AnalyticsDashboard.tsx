"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  Coins,
  Download,
  Filter,
  MousePointerClick,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  analyticsApi,
  toCsv,
  type AnalyticsSummary,
  type FunnelResponse,
  type NetworkBreakdownRow,
  type TimeseriesMetric,
  type TimeseriesResponse,
  type TopCouponRow,
  type TopStoreRow,
} from "@/lib/api/analytics";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

// Pie wedges cycle through the brand roles. Mirror of the --cv-* vars in
// globals.css — kept inline because Recharts resolves the fill string at
// render and doesn't read CSS variables for `<Cell fill="..."/>`.
const PIE_COLORS = ["#5B21B6", "#F97316", "#10b981", "#DC2626", "#475569"];

type Props = {
  initialDays: number;
  initialSummary: AnalyticsSummary | null;
  initialTimeseries: TimeseriesResponse | null;
  initialTopStores: TopStoreRow[];
  initialTopCoupons: TopCouponRow[];
  initialFunnel: FunnelResponse | null;
  initialByNetwork: NetworkBreakdownRow[];
};

export function AnalyticsDashboard({
  initialDays,
  initialSummary,
  initialTimeseries,
  initialTopStores,
  initialTopCoupons,
  initialFunnel,
  initialByNetwork,
}: Props) {
  const [days, setDays] = useState(initialDays);
  const [metric, setMetric] = useState<TimeseriesMetric>(
    (initialTimeseries?.metric as TimeseriesMetric) ?? "clicks"
  );
  const [summary, setSummary] = useState<AnalyticsSummary | null>(initialSummary);
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(initialTimeseries);
  const [topStores, setTopStores] = useState<TopStoreRow[]>(initialTopStores);
  const [topCoupons, setTopCoupons] = useState<TopCouponRow[]>(initialTopCoupons);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(initialFunnel);
  const [byNetwork, setByNetwork] = useState<NetworkBreakdownRow[]>(initialByNetwork);
  const [busy, setBusy] = useState(false);

  async function reload(nextDays: number, nextMetric: TimeseriesMetric) {
    setBusy(true);
    try {
      const [s, ts, st, tc, f, n] = await Promise.all([
        analyticsApi.summary(nextDays),
        analyticsApi.timeseries(nextMetric, nextDays),
        analyticsApi.topStores(10),
        analyticsApi.topCoupons(10),
        analyticsApi.funnel(nextDays),
        analyticsApi.byNetwork(nextDays),
      ]);
      setSummary(s);
      setTimeseries(ts);
      setTopStores(st);
      setTopCoupons(tc);
      setFunnel(f);
      setByNetwork(n);
    } finally {
      setBusy(false);
    }
  }

  function changeDays(d: number) {
    setDays(d);
    reload(d, metric);
  }

  function changeMetric(m: TimeseriesMetric) {
    setMetric(m);
    analyticsApi.timeseries(m, days).then(setTimeseries).catch(() => undefined);
  }

  function downloadCsv(name: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tsData = useMemo(
    () =>
      (timeseries?.points ?? []).map((p) => ({
        day: p.day.slice(5),
        value: p.value,
      })),
    [timeseries]
  );

  const fmt = (n: number | null | undefined) =>
    typeof n === "number" ? n.toLocaleString() : "—";

  // ── Derived metrics ──────────────────────────────────────────────────────
  const conversionRate =
    summary && summary.clicksInRange > 0
      ? (summary.conversionsInRange / summary.clicksInRange) * 100
      : null;

  const approvalRate =
    summary && summary.conversionsInRange > 0
      ? (summary.approvedConversionsInRange / summary.conversionsInRange) * 100
      : null;

  // Today vs avg daily share (last `days`) — proxy for "trend" until we have
  // a real period-over-period endpoint.
  const dailyAvg = summary && days > 0 ? summary.clicksInRange / days : 0;
  const todayDeltaPct =
    summary && dailyAvg > 0
      ? ((summary.clicksToday - dailyAvg) / dailyAvg) * 100
      : null;

  // Recharts <Area> needs a literal hex/var string at render — the SVG won't
  // resolve a Tailwind class. Map each timeseries metric to one brand role.
  const accentMetric: Record<TimeseriesMetric, string> = {
    clicks:      "#5B21B6", // cv-primary (violet)
    conversions: "#10b981", // cv-success (emerald)
    signups:     "#F97316", // cv-accent (orange)
  };
  const metricColor = accentMetric[metric];

  return (
    <div className="space-y-6">
      {/* Range + filter strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            <Filter className="h-3.5 w-3.5" />
            Range
          </span>
          <div className="inline-flex overflow-hidden rounded-md border bg-white text-xs">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => changeDays(r.value)}
                disabled={busy}
                className={`px-3 py-1.5 text-xs font-semibold tabular-nums transition ${
                  days === r.value
                    ? "bg-gradient-to-r from-cv-primary to-cv-accent text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-cv-neutral-500">
          Materialised views refresh every 15 min · cached 5 min on top.{" "}
          {busy && <span className="font-semibold text-cv-primary">Refreshing…</span>}
        </p>
      </div>

      {/* Hero KPI tiles — four big, gradient-themed */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroTile
          label="Total users"
          value={fmt(summary?.users)}
          deltaLabel={`+${fmt(summary?.signupsInRange)} in ${days}d`}
          deltaPositive
          icon={<Users className="h-5 w-5" />}
          gradient="from-cv-primary to-cv-primary-strong"
        />
        <HeroTile
          label={`Clicks (${days}d)`}
          value={fmt(summary?.clicksInRange)}
          deltaLabel={`${fmt(summary?.clicksToday)} today`}
          deltaPct={todayDeltaPct}
          icon={<MousePointerClick className="h-5 w-5" />}
          gradient="from-cv-accent to-cv-accent-strong"
        />
        <HeroTile
          label={`Conversions (${days}d)`}
          value={fmt(summary?.conversionsInRange)}
          deltaLabel={`${fmt(summary?.approvedConversionsInRange)} approved`}
          deltaPositive={(summary?.approvedConversionsInRange ?? 0) > 0}
          icon={<BadgePercent className="h-5 w-5" />}
          gradient="from-cv-success to-cv-success-strong"
        />
        <HeroTile
          label={`Commission (${days}d)`}
          value={
            summary?.commissionInRange && summary.commissionInRange !== "0"
              ? `${summary.commissionCurrency || ""} ${Number(
                  summary.commissionInRange
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : "—"
          }
          deltaLabel="approved"
          icon={<Coins className="h-5 w-5" />}
          gradient="from-cv-neutral-600 to-cv-neutral-800"
        />
      </div>

      {/* Secondary KPI strip — small, dense */}
      <div className="grid gap-3 md:grid-cols-4">
        <MiniTile
          label="Conversion rate"
          value={conversionRate !== null ? `${conversionRate.toFixed(2)}%` : "—"}
          sub={`${fmt(summary?.conversionsInRange)} / ${fmt(summary?.clicksInRange)}`}
          color="text-cv-success"
          dot="bg-cv-success"
        />
        <MiniTile
          label="Approval rate"
          value={approvalRate !== null ? `${approvalRate.toFixed(0)}%` : "—"}
          sub={`${fmt(summary?.approvedConversionsInRange)} approved of ${fmt(summary?.conversionsInRange)}`}
          color="text-cv-primary"
          dot="bg-cv-primary"
        />
        <MiniTile
          label="Top store"
          value={summary?.topStoreName ?? "—"}
          sub={`${fmt(summary?.topStoreClicks)} clicks (30d)`}
          color="text-cv-primary"
          dot="bg-cv-primary"
          icon={<Trophy className="h-3.5 w-3.5" />}
        />
        <MiniTile
          label="Top coupon"
          value={summary?.topCouponTitle ?? "—"}
          sub={`${fmt(summary?.topCouponClicks)} clicks (30d)`}
          color="text-cv-accent"
          dot="bg-cv-accent"
          icon={<Star className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Time-series chart — gradient-fill area */}
      <section className="rounded-md border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Activity className="h-4 w-4 text-cv-primary" />
              {metric === "clicks"
                ? "Daily clicks"
                : metric === "conversions"
                  ? "Daily conversions"
                  : "Daily signups"}
            </h2>
            <p className="text-xs text-cv-neutral-500">
              Rolling {days}-day view · refreshed every 15 min
            </p>
          </div>
          <div className="inline-flex overflow-hidden rounded-md border bg-white text-xs">
            {(["clicks", "conversions", "signups"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => changeMetric(m)}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  metric === m
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tsData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metricColor} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={metricColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" fontSize={11} tickMargin={6} stroke="#94a3b8" />
              <YAxis fontSize={11} width={40} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.18)",
                }}
                labelStyle={{ fontSize: 11, fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={metricColor}
                fill="url(#area-fill)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top stores */}
        <section className="overflow-hidden rounded-md border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-cv-primary-soft to-cv-accent-soft px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Trophy className="h-4 w-4 text-cv-primary" />
              Top stores · 30 days
            </h2>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "top-stores.csv",
                  toCsv(
                    ["slug", "name", "clicks", "conversions", "commission"],
                    topStores.map((r) => [
                      r.storeSlug,
                      r.storeName,
                      r.clicks,
                      r.conversions,
                      r.commission,
                    ])
                  )
                )
              }
              className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:text-cv-primary-strong"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          </div>
          <div className="p-5">
            {topStores.length === 0 ? (
              <EmptyHint
                title="No store activity yet"
                hint="Once visitors click on store cards, top stores by clicks will show up here."
              />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topStores
                      .slice(0, 10)
                      .map((r) => ({ name: r.storeName, clicks: r.clicks }))}
                    layout="vertical"
                    margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="bar-brand" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#5B21B6" />
                        <stop offset="100%" stopColor="#4C1D95" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" fontSize={11} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="name" fontSize={11} width={110} stroke="#475569" />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="clicks" fill="url(#bar-brand)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Top coupons */}
        <section className="overflow-hidden rounded-md border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-cv-accent-soft to-cv-accent-soft px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Star className="h-4 w-4 text-cv-accent" />
              Top coupons · 30 days
            </h2>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "top-coupons.csv",
                  toCsv(
                    ["slug", "title", "store", "clicks"],
                    topCoupons.map((r) => [
                      r.couponSlug,
                      r.couponTitle,
                      r.storeName ?? "",
                      r.clicks,
                    ])
                  )
                )
              }
              className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:text-cv-accent-strong"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          </div>
          <div className="p-5">
            {topCoupons.length === 0 ? (
              <EmptyHint
                title="No coupon clicks yet"
                hint="When users reveal coupon codes, the most-clicked ones land here."
              />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-cv-neutral-500">
                  <tr>
                    <th className="pb-2 font-bold">#</th>
                    <th className="pb-2 font-bold">Coupon</th>
                    <th className="pb-2 font-bold">Store</th>
                    <th className="pb-2 text-right font-bold">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topCoupons.slice(0, 8).map((r, i) => (
                    <tr key={r.couponId} className="text-gray-800">
                      <td className="py-2 font-bold tabular-nums text-cv-neutral-400">
                        {i + 1}
                      </td>
                      <td className="py-2 line-clamp-1 max-w-[200px] font-medium">
                        {r.couponTitle}
                      </td>
                      <td className="py-2 text-cv-neutral-500">{r.storeName ?? "—"}</td>
                      <td className="py-2 text-right">
                        <span className="rounded-full bg-cv-accent-soft px-2 py-0.5 text-xs font-bold tabular-nums text-cv-accent-strong">
                          {r.clicks.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Funnel */}
        <section className="overflow-hidden rounded-md border bg-white shadow-sm">
          <div className="border-b bg-gradient-to-r from-cv-success-soft to-cv-success-soft px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <BadgePercent className="h-4 w-4 text-cv-success" />
              Funnel · {days} days
            </h2>
          </div>
          <div className="space-y-4 p-5">
            <FunnelBar
              label="Clicks"
              value={funnel?.clicks ?? 0}
              max={funnel?.clicks ?? 0}
              accent="from-cv-primary to-cv-primary"
            />
            <FunnelBar
              label="Conversions"
              value={funnel?.conversionsAttempted ?? 0}
              max={funnel?.clicks ?? 0}
              accent="from-cv-primary to-cv-accent"
              hint={
                funnel && funnel.clicks > 0
                  ? `${((funnel.conversionsAttempted / funnel.clicks) * 100).toFixed(2)}% of clicks`
                  : undefined
              }
            />
            <FunnelBar
              label="Approved"
              value={funnel?.conversionsApproved ?? 0}
              max={funnel?.clicks ?? 0}
              accent="from-cv-success to-cv-success"
              hint={
                funnel && funnel.conversionsAttempted > 0
                  ? `${((funnel.conversionsApproved / funnel.conversionsAttempted) * 100).toFixed(0)}% of conversions approved`
                  : undefined
              }
            />
            <div className="rounded-md border border-cv-success/30 bg-gradient-to-r from-cv-success-soft to-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cv-success-strong">
                Approved commission
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-gray-900">
                {funnel?.approvedCommission && funnel.approvedCommission !== "0"
                  ? `${funnel.commissionCurrency || ""} ${Number(
                      funnel.approvedCommission
                    ).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Network breakdown */}
        <section className="overflow-hidden rounded-md border bg-white shadow-sm">
          <div className="border-b bg-gradient-to-r from-cv-primary-soft to-cv-primary-soft px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Sparkles className="h-4 w-4 text-cv-primary" />
              Network breakdown · {days} days
            </h2>
          </div>
          <div className="p-5">
            {byNetwork.length === 0 ? (
              <EmptyHint
                title="No network traffic"
                hint="Once an affiliate network sends clicks or postbacks, the split shows up here."
              />
            ) : (
              <div className="grid items-center gap-4 md:grid-cols-2">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byNetwork.map((n) => ({
                          name: n.networkName,
                          value: n.clicks,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {byNetwork.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-left text-[10px] font-bold uppercase tracking-widest text-cv-neutral-500">
                    <tr>
                      <th className="pb-2">Network</th>
                      <th className="pb-2 text-right">Clicks</th>
                      <th className="pb-2 text-right">Approved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byNetwork.map((n, i) => (
                      <tr key={n.networkId}>
                        <td className="py-1.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              aria-hidden
                              className="h-2 w-2 rounded-full"
                              style={{
                                background: PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                            {n.networkName}
                          </span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {n.clicks.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {n.approvedConversions.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ────────────────────────  Reusable widgets  ──────────────────────────── */

function HeroTile({
  label,
  value,
  deltaLabel,
  deltaPct,
  deltaPositive,
  icon,
  gradient,
}: {
  label: string;
  value: string;
  deltaLabel: string;
  deltaPct?: number | null;
  deltaPositive?: boolean;
  icon: ReactNode;
  gradient: string;
}) {
  const showDelta = typeof deltaPct === "number";
  const isPositive =
    typeof deltaPct === "number" ? deltaPct >= 0 : !!deltaPositive;
  return (
    <div className="relative overflow-hidden rounded-md border bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Glow */}
      <span
        aria-hidden
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-15 blur-2xl ${gradient}`}
      />
      <div className="relative flex items-start justify-between">
        <span
          className={`grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br text-white shadow-md ${gradient}`}
        >
          {icon}
        </span>
        {showDelta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              isPositive
                ? "bg-cv-success-soft text-cv-success-strong"
                : "bg-cv-accent-soft text-cv-accent-strong"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(deltaPct ?? 0).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="relative mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-cv-neutral-500">
        {label}
      </p>
      <p className="relative mt-1 line-clamp-1 text-3xl font-extrabold tabular-nums text-gray-900">
        {value}
      </p>
      <p className="relative mt-1 text-[11px] text-cv-neutral-500">{deltaLabel}</p>
    </div>
  );
}

function MiniTile({
  label,
  value,
  sub,
  color,
  dot,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  dot: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-md border bg-white p-3 shadow-sm">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cv-neutral-500">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
        {label}
      </p>
      <p
        className={`mt-1.5 line-clamp-1 text-base font-bold tabular-nums ${color}`}
      >
        {icon && <span className="mr-1 inline-block align-text-bottom">{icon}</span>}
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 line-clamp-1 text-[11px] text-cv-neutral-500">{sub}</p>
      )}
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  accent,
  hint,
}: {
  label: string;
  value: number;
  max: number;
  accent: string;
  hint?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
          {label}
        </span>
        <span className="text-sm font-extrabold tabular-nums text-gray-900">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${accent}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-cv-neutral-500">{hint}</p>}
    </div>
  );
}

function EmptyHint({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="grid place-items-center px-4 py-10 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-cv-neutral-100 to-cv-neutral-50 text-cv-neutral-400 shadow-sm">
        <Activity className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-bold text-gray-800">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-cv-neutral-500">{hint}</p>
    </div>
  );
}
