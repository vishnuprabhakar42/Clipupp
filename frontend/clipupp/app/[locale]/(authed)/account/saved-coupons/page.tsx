import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bookmark } from "lucide-react";
import { accountFetch } from "@/lib/account/server-fetch";
import type { CursorPage } from "@/lib/api/types";
import type { SavedCouponItem } from "@/lib/api/savedCoupons";
import { SavedCouponCard } from "@/features/savedcoupons/components/SavedCouponCard";

export const metadata: Metadata = {
  title: "Saved coupons",
  robots: { index: false },
};

type SearchParams = Promise<{ cursor?: string }>;

export default async function SavedCouponsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const qs = sp.cursor
    ? `?cursor=${encodeURIComponent(sp.cursor)}&limit=24`
    : `?limit=24`;
  const page = await accountFetch<CursorPage<SavedCouponItem>>(
    `/api/v1/account/saved-coupons${qs}`
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-clipupp-neutral-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-clipupp-neutral-200 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-neutral-700">
            <Bookmark className="h-4 w-4 text-clipupp-accent" />
            Saved coupons
          </h2>
          {page && page.data.length > 0 && (
            <span className="clipupp-tag bg-transparent px-0">
              {page.data.length} {page.data.length === 1 ? "item" : "items"}
              {page.page.hasMore ? "+" : ""}
            </span>
          )}
        </div>

        <div className="p-5">
          {!page ? (
            <p className="text-sm text-clipupp-danger">
              Could not load your saved coupons. Please refresh the page.
            </p>
          ) : page.data.length === 0 ? (
            <div className="rounded-lg border border-dashed border-clipupp-neutral-200 bg-clipupp-neutral-50 px-6 py-12 text-center">
              <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-md bg-clipupp-accent text-white">
                <Bookmark className="h-7 w-7" aria-hidden />
              </span>
              <h3 className="clipupp-h3">No saved coupons yet</h3>
              <p className="clipupp-body mx-auto mt-1 max-w-md text-clipupp-neutral-600">
                Tap the <Bookmark className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
                bookmark on any coupon — they all collect here so you can revisit
                them before they expire.
              </p>
              <Link
                href="/coupons"
                className="mt-5 inline-flex items-center gap-1 rounded-md bg-clipupp-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-clipupp-primary-strong"
              >
                Browse all coupons
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
              {page.data.map((item) => (
                <SavedCouponCard key={item.couponId} item={item} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {page?.page.hasMore && page.page.nextCursor && (
        <div className="text-center">
          <Link
            href={`/account/saved-coupons?cursor=${encodeURIComponent(
              page.page.nextCursor
            )}`}
            className="inline-flex items-center gap-1 rounded-md border-[1.5px] border-clipupp-primary bg-white px-4 py-2 text-sm font-semibold text-clipupp-primary transition-colors hover:bg-clipupp-primary-soft"
          >
            Load more
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
