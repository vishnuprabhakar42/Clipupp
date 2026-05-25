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
      <section className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-cv-accent-soft to-cv-accent-soft px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-700">
            <Bookmark className="h-4 w-4 text-cv-accent" />
            Saved coupons
          </h2>
          {page && page.data.length > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-cv-neutral-500">
              {page.data.length} {page.data.length === 1 ? "item" : "items"}
              {page.page.hasMore ? "+" : ""}
            </span>
          )}
        </div>

        <div className="p-5">
          {!page ? (
            <p className="text-sm text-destructive">
              Could not load your saved coupons. Please refresh the page.
            </p>
          ) : page.data.length === 0 ? (
            <div className="rounded-md border border-dashed bg-gray-50/40 px-6 py-12 text-center">
              <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-md bg-gradient-to-br from-cv-accent to-cv-accent text-white shadow-lg">
                <Bookmark className="h-7 w-7" aria-hidden />
              </span>
              <h3 className="text-base font-bold text-gray-900">
                No saved coupons yet
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
                Tap the <Bookmark className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
                bookmark on any coupon — they all collect here so you can revisit
                them before they expire.
              </p>
              <Link
                href="/coupons"
                className="mt-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cv-accent to-cv-accent px-5 py-2 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Browse all coupons
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            className="inline-flex items-center gap-1 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:border-cv-accent/30 hover:text-cv-accent"
          >
            Load more
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
