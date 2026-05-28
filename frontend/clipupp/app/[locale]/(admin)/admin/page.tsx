import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Images,
  LayoutGrid,
  LinkIcon,
  Mail,
  Network,
  ShieldCheck,
  Sparkles,
  Store,
  TicketPercent,
  Users,
} from "lucide-react";
import { getServerSession } from "@/lib/auth/server";
import { adminFetch } from "@/lib/admin/server-fetch";
import type {
  AnalyticsSummary,
  FunnelResponse,
  NetworkBreakdownRow,
  TimeseriesResponse,
  TopCouponRow,
  TopStoreRow,
} from "@/lib/api/analytics";
import { AnalyticsDashboard } from "@/features/admin/components/AnalyticsDashboardLazy";

export const metadata: Metadata = {
  title: "Admin · Dashboard",
  robots: { index: false },
};

const DEFAULT_DAYS = 30;

export default async function AdminDashboardPage() {
  // All data fetched in parallel server-side so the dashboard streams with
  // a single render — no client-side waterfalls, fastest possible LCP.
  const [user, summary, timeseries, topStores, topCoupons, funnel, byNetwork] =
    await Promise.all([
      getServerSession(),
      adminFetch<AnalyticsSummary>(`/api/v1/admin/analytics/summary?days=${DEFAULT_DAYS}`),
      adminFetch<TimeseriesResponse>(
        `/api/v1/admin/analytics/timeseries?metric=clicks&days=${DEFAULT_DAYS}`
      ),
      adminFetch<TopStoreRow[]>(`/api/v1/admin/analytics/top-stores?limit=10`),
      adminFetch<TopCouponRow[]>(`/api/v1/admin/analytics/top-coupons?limit=10`),
      adminFetch<FunnelResponse>(`/api/v1/admin/analytics/funnel?days=${DEFAULT_DAYS}`),
      adminFetch<NetworkBreakdownRow[]>(
        `/api/v1/admin/analytics/by-network?days=${DEFAULT_DAYS}`
      ),
    ]);

  const firstName = (user?.name || user?.email || "Admin").split(/[\s@]/)[0];
  const greeting = greetingFor(new Date());

  return (
    <div className="space-y-6">
      {/* Hero — soft navy + gold radial wash (mirrors var(--clipupp-primary)/accent) */}
      <section
        className="relative overflow-hidden rounded-md border bg-white shadow-sm"
        style={{
          backgroundImage:
            "radial-gradient(70% 70% at 0% 0%, rgba(4,37,88,0.08) 0%, transparent 60%), radial-gradient(60% 80% at 100% 0%, rgba(245,158,11,0.08) 0%, transparent 70%), linear-gradient(180deg,#ffffff 0%,var(--clipupp-primary-soft) 100%)",
        }}
      >
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-gradient-to-br from-clipupp-primary to-clipupp-accent text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clipupp-primary">
                {greeting} · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                Welcome back, {firstName} 👋
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-600">
                Here&apos;s how Clipupp performed in the last {DEFAULT_DAYS} days. Use the
                range pills below to zoom in, drill into any tile, or jump into one of the modules
                on the right.
              </p>
            </div>
          </div>

          {/* Snapshot strip — three small live numbers, one brand role each */}
          <div className="flex gap-2.5">
            <Snapshot
              label="Signups today"
              value={summary?.signupsToday ?? 0}
              accent="from-clipupp-primary to-clipupp-primary-strong"
            />
            <Snapshot
              label="Clicks today"
              value={summary?.clicksToday ?? 0}
              accent="from-clipupp-accent to-clipupp-accent-strong"
            />
            <Snapshot
              label="Conv today"
              value={summary?.conversionsToday ?? 0}
              accent="from-clipupp-success to-clipupp-success-strong"
            />
          </div>
        </div>
      </section>

      {/* Analytics — KPI tiles, time-series, top-N, funnel, network breakdown */}
      <AnalyticsDashboard
        initialDays={DEFAULT_DAYS}
        initialSummary={summary}
        initialTimeseries={timeseries}
        initialTopStores={topStores ?? []}
        initialTopCoupons={topCoupons ?? []}
        initialFunnel={funnel}
        initialByNetwork={byNetwork ?? []}
      />

      {/* Quick links — colourful module shortcuts */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-clipupp-neutral-500">
          Jump to a module
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Each module card maps to one of the 5 brand role gradients —
              kept consistent with the on-page section accents. */}
          <ModuleCard
            href="/admin/homepage"
            title="Homepage"
            sub="Sections & layout"
            Icon={LayoutGrid}
            accent="from-clipupp-primary to-clipupp-primary-strong"
          />
          <ModuleCard
            href="/admin/banners"
            title="Banners"
            sub="Hero, top bar, promo cards"
            Icon={Images}
            accent="from-clipupp-accent to-clipupp-accent-strong"
          />
          <ModuleCard
            href="/admin/stores"
            title="Stores"
            sub="Brand catalogue"
            Icon={Store}
            accent="from-clipupp-primary to-clipupp-primary-strong"
          />
          <ModuleCard
            href="/admin/coupons"
            title="Coupons"
            sub="Codes, sales, dates"
            Icon={TicketPercent}
            accent="from-clipupp-accent to-clipupp-accent-strong"
          />
          <ModuleCard
            href="/admin/blog"
            title="Blog"
            sub="Articles & guides"
            Icon={BookOpen}
            accent="from-clipupp-success to-clipupp-success-strong"
          />
          <ModuleCard
            href="/admin/networks"
            title="Networks"
            sub="Affiliate adapters"
            Icon={Network}
            accent="from-clipupp-primary to-clipupp-primary-strong"
          />
          <ModuleCard
            href="/admin/users"
            title="Users"
            sub="Roles & permissions"
            Icon={Users}
            accent="from-clipupp-neutral-600 to-clipupp-neutral-800"
          />
          <ModuleCard
            href="/admin/clicks"
            title="Click stream"
            sub="Raw redirect log"
            Icon={LinkIcon}
            accent="from-clipupp-primary to-clipupp-primary-strong"
          />
          <ModuleCard
            href="/admin/conversions"
            title="Conversions"
            sub="Postbacks & payouts"
            Icon={ShieldCheck}
            accent="from-clipupp-success to-clipupp-success-strong"
          />
          <ModuleCard
            href="/admin/newsletter"
            title="Newsletter"
            sub="Subscribers & campaigns"
            Icon={Mail}
            accent="from-clipupp-accent to-clipupp-accent-strong"
          />
          <ModuleCard
            href="/admin/settings"
            title="Settings"
            sub="Site-wide config"
            Icon={Sparkles}
            accent="from-clipupp-neutral-500 to-clipupp-neutral-700"
          />
        </div>
      </section>
    </div>
  );
}

/* ────────────────────────────  Helpers  ────────────────────────────────── */

function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Snapshot({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-md border bg-white p-3 text-center shadow-sm">
      <p
        className={`bg-gradient-to-br bg-clip-text text-2xl font-extrabold tabular-nums text-transparent ${accent}`}
      >
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-clipupp-neutral-500">
        {label}
      </p>
    </div>
  );
}

function ModuleCard({
  href,
  title,
  sub,
  Icon,
  accent,
}: {
  href: string;
  title: string;
  sub: string;
  Icon: typeof Store;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-md border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        aria-hidden
        className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition group-hover:opacity-20 ${accent}`}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <span
            className={`grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br text-white shadow-sm ${accent}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="mt-2.5 text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-clipupp-neutral-500">{sub}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-700" />
      </div>
    </Link>
  );
}
