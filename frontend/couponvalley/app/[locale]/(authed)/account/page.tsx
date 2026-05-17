import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  MousePointerClick,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";
import { getServerSession } from "@/lib/auth/server";
import { accountFetch } from "@/lib/account/server-fetch";
import type { CursorPage } from "@/lib/api/types";
import type { SavedCouponItem } from "@/lib/api/savedCoupons";

export const metadata: Metadata = {
  title: "Account overview",
  robots: { index: false },
};

type ClickRow = {
  clickId: string;
  couponId: string;
  storeId: string;
  outboundUrl: string;
  createdAt: string;
};

export default async function AccountPage() {
  const user = await getServerSession();
  if (!user) return null;

  // Fetch overview data in parallel: latest saved coupons + recent clicks.
  const [saved, clicks] = await Promise.all([
    accountFetch<CursorPage<SavedCouponItem>>(
      "/api/v1/account/saved-coupons?limit=4"
    ),
    accountFetch<CursorPage<ClickRow>>("/api/v1/account/clicks?limit=5"),
  ]);

  const savedItems = saved?.data ?? [];
  const clickItems = clicks?.data ?? [];
  const savedHasMore = saved?.page.hasMore ?? false;
  const clicksHasMore = clicks?.page.hasMore ?? false;

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Saved coupons"
          value={`${savedItems.length}${savedHasMore ? "+" : ""}`}
          Icon={Bookmark}
          accent="from-cv-accent to-cv-accent"
          href="/account/saved-coupons"
        />
        <StatTile
          label="Recent clicks"
          value={`${clickItems.length}${clicksHasMore ? "+" : ""}`}
          Icon={MousePointerClick}
          accent="from-cv-accent to-cv-accent"
          href="/account/click-history"
        />
        <StatTile
          label="Coupons used"
          value={`${clickItems.length}${clicksHasMore ? "+" : ""}`}
          sub="Tracked clicks"
          Icon={Wallet}
          accent="from-cv-success to-cv-success"
        />
      </ul>

      {/* At a glance */}
      <section className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
        <div className="border-b bg-gradient-to-r from-cv-primary-soft to-cv-accent-soft px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-700">
            <Sparkles className="h-4 w-4 text-cv-primary" />
            At a glance
          </h2>
        </div>
        <dl className="grid gap-4 p-5 text-sm md:grid-cols-2">
          <Field label="Email">{user.email}</Field>
          <Field label="Email verified">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                user.emailVerified
                  ? "bg-cv-success-soft text-cv-success-strong"
                  : "bg-cv-accent-soft text-cv-accent-strong"
              }`}
            >
              {user.emailVerified ? "Verified" : "Unverified"}
            </span>
          </Field>
          <Field label="Locale">{user.locale}</Field>
          <Field label="Roles">
            <div className="flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700"
                >
                  {r.replace("_", " ")}
                </span>
              ))}
            </div>
          </Field>
        </dl>
      </section>

      {/* Saved coupons preview */}
      <section className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-cv-accent-soft to-cv-accent-soft px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-700">
            <Bookmark className="h-4 w-4 text-cv-accent" />
            Saved coupons
          </h2>
          {savedItems.length > 0 && (
            <Link
              href="/account/saved-coupons"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cv-accent hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="p-5">
          {savedItems.length === 0 ? (
            <EmptyState
              Icon={Bookmark}
              title="No saved coupons yet"
              text="Tap the bookmark icon on any coupon to keep it here for later. We'll remind you before it expires."
              ctaLabel="Browse coupons"
              ctaHref="/coupons"
              accent="from-cv-accent to-cv-accent"
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {savedItems.map((it) => (
                <SavedCard key={it.couponId} item={it} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Click history preview */}
      <section className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-cv-accent-soft to-cv-accent-soft px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-700">
            <MousePointerClick className="h-4 w-4 text-cv-accent" />
            Recent clicks
          </h2>
          {clickItems.length > 0 && (
            <Link
              href="/account/click-history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cv-accent-strong hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="p-5">
          {clickItems.length === 0 ? (
            <EmptyState
              Icon={MousePointerClick}
              title="No clicks recorded"
              text="Visit a store and click a coupon — we'll keep a history of every code you tried right here."
              ctaLabel="Browse stores"
              ctaHref="/stores"
              accent="from-cv-accent to-cv-accent"
            />
          ) : (
            <ul className="space-y-2">
              {clickItems.map((c) => (
                <li
                  key={c.clickId}
                  className="flex items-center gap-3 rounded-lg border bg-gray-50/50 px-3 py-2 text-sm"
                >
                  <Tag className="h-4 w-4 shrink-0 text-cv-accent" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-700">
                    {c.outboundUrl}
                  </span>
                  <span className="shrink-0 text-[11px] text-cv-neutral-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  Icon,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: typeof Bookmark;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className="group relative overflow-hidden rounded-md border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span
        className={`grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br ${accent} text-white shadow-sm`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-3 text-2xl font-black tabular-nums text-gray-900">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-cv-neutral-500">
        {label}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-cv-neutral-400">{sub}</p>}
    </div>
  );
  return <li>{href ? <Link href={href}>{inner}</Link> : inner}</li>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-cv-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{children}</dd>
    </div>
  );
}

function EmptyState({
  Icon,
  title,
  text,
  ctaLabel,
  ctaHref,
  accent,
}: {
  Icon: typeof Bookmark;
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  accent: string;
}) {
  return (
    <div className="rounded-md border border-dashed bg-gray-50/40 px-6 py-8 text-center">
      <span
        className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-gradient-to-br ${accent} text-white shadow-sm`}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-gray-600">{text}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex items-center gap-1 rounded-full bg-gray-900 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800"
      >
        {ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function SavedCard({ item }: { item: SavedCouponItem }) {
  return (
    <li className="group overflow-hidden rounded-md border border-gray-100 bg-white transition hover:-translate-y-0.5 hover:border-cv-accent/30 hover:shadow-md">
      {item.couponSlug ? (
        <Link
          href={`/coupons/${item.couponSlug}`}
          className="flex h-full flex-col gap-1.5 p-4"
        >
          <p className="line-clamp-1 text-sm font-bold tracking-tight text-gray-900 group-hover:text-cv-accent">
            {item.couponTitle ?? "(untitled)"}
          </p>
          {item.savingsLabel && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-cv-accent-soft px-2 py-0.5 text-[11px] font-bold text-cv-accent-strong">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              {item.savingsLabel}
            </span>
          )}
          <p className="mt-auto text-[10px] text-cv-neutral-400">
            Saved {new Date(item.savedAt).toLocaleDateString()}
          </p>
        </Link>
      ) : (
        <div className="p-4 text-xs text-cv-neutral-500">
          This coupon was removed from the catalog.
        </div>
      )}
    </li>
  );
}
