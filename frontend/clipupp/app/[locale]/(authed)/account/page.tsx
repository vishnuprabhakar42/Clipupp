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
          href="/account/saved-coupons"
        />
        <StatTile
          label="Recent clicks"
          value={`${clickItems.length}${clicksHasMore ? "+" : ""}`}
          Icon={MousePointerClick}
          href="/account/click-history"
        />
        <StatTile
          label="Coupons used"
          value={`${clickItems.length}${clicksHasMore ? "+" : ""}`}
          sub="Tracked clicks"
          Icon={Wallet}
        />
      </ul>

      {/* At a glance */}
      <section className="overflow-hidden rounded-lg border border-clipupp-neutral-200 bg-white shadow-card">
        <div className="border-b border-clipupp-neutral-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-neutral-700">
            <Sparkles className="h-4 w-4 text-clipupp-primary" />
            At a glance
          </h2>
        </div>
        <dl className="grid gap-4 p-5 text-sm md:grid-cols-2">
          <Field label="Email">{user.email}</Field>
          <Field label="Email verified">
            <span
              className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] ${
                user.emailVerified
                  ? "bg-clipupp-success-soft text-clipupp-success-strong"
                  : "bg-clipupp-accent-soft text-clipupp-accent-strong"
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
                  className="rounded-sm bg-clipupp-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-neutral-700"
                >
                  {r.replace("_", " ")}
                </span>
              ))}
            </div>
          </Field>
        </dl>
      </section>

      {/* Saved coupons preview */}
      <section className="overflow-hidden rounded-lg border border-clipupp-neutral-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-clipupp-neutral-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-neutral-700">
            <Bookmark className="h-4 w-4 text-clipupp-accent" />
            Saved coupons
          </h2>
          {savedItems.length > 0 && (
            <Link
              href="/account/saved-coupons"
              className="inline-flex items-center gap-1 text-xs font-semibold text-clipupp-primary hover:underline"
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
      <section className="overflow-hidden rounded-lg border border-clipupp-neutral-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-clipupp-neutral-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-neutral-700">
            <MousePointerClick className="h-4 w-4 text-clipupp-accent" />
            Recent clicks
          </h2>
          {clickItems.length > 0 && (
            <Link
              href="/account/click-history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-clipupp-primary hover:underline"
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
            />
          ) : (
            <ul className="space-y-2">
              {clickItems.map((c) => (
                <li
                  key={c.clickId}
                  className="flex items-center gap-3 rounded-md border border-clipupp-neutral-200 bg-clipupp-neutral-50 px-3 py-2 text-sm"
                >
                  <Tag className="h-4 w-4 shrink-0 text-clipupp-accent" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-clipupp-neutral-700">
                    {c.outboundUrl}
                  </span>
                  <span className="shrink-0 text-[11px] text-clipupp-neutral-500">
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
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: typeof Bookmark;
  href?: string;
}) {
  const inner = (
    <div className="relative overflow-hidden rounded-lg border border-clipupp-neutral-200 bg-white p-4 shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-clipupp-primary text-white">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-3 clipupp-price">{value}</p>
      <p className="clipupp-tag bg-transparent px-0">{label}</p>
      {sub && <p className="clipupp-meta mt-0.5">{sub}</p>}
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
      <dt className="clipupp-tag bg-transparent px-0">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-clipupp-neutral-900">{children}</dd>
    </div>
  );
}

function EmptyState({
  Icon,
  title,
  text,
  ctaLabel,
  ctaHref,
}: {
  Icon: typeof Bookmark;
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-clipupp-neutral-200 bg-clipupp-neutral-50 px-6 py-8 text-center">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-clipupp-primary text-white">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="clipupp-h3">{title}</h3>
      <p className="clipupp-body mx-auto mt-1 max-w-md text-clipupp-neutral-600">{text}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex items-center gap-1 rounded-md bg-clipupp-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-clipupp-primary-strong"
      >
        {ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function SavedCard({ item }: { item: SavedCouponItem }) {
  return (
    <li className="group overflow-hidden rounded-lg border border-clipupp-neutral-200 bg-white shadow-card">
      {item.couponSlug ? (
        <Link
          href={`/coupons/${item.couponSlug}`}
          className="flex h-full flex-col gap-1.5 p-4"
        >
          <p className="line-clamp-1 clipupp-h3 group-hover:text-clipupp-primary">
            {item.couponTitle ?? "(untitled)"}
          </p>
          {item.savingsLabel && (
            <span className="inline-flex w-fit items-center gap-1 rounded-sm bg-clipupp-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-accent-strong">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              {item.savingsLabel}
            </span>
          )}
          <p className="clipupp-meta mt-auto">
            Saved {new Date(item.savedAt).toLocaleDateString()}
          </p>
        </Link>
      ) : (
        <div className="p-4 text-xs text-clipupp-neutral-500">
          This coupon was removed from the catalog.
        </div>
      )}
    </li>
  );
}
