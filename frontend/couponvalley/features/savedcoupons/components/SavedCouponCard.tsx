"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, BookmarkX, Sparkles } from "lucide-react";
import { savedCouponsApi, type SavedCouponItem } from "@/lib/api/savedCoupons";
import { isApiError } from "@/lib/api/errors";

/**
 * Saved-coupon card with inline remove. Click the title → navigates to the
 * coupon. Click the X → optimistic remove + DELETE call. On failure, the
 * card snaps back into the list.
 */
export function SavedCouponCard({ item }: { item: SavedCouponItem }) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || removed) return;
    if (!confirm("Remove this from your saved coupons?")) return;
    setBusy(true);
    setRemoved(true);
    try {
      await savedCouponsApi.unsave(item.couponId);
      toast.success("Removed");
      // Refresh the list (server-rendered).
      router.refresh();
    } catch (err) {
      setRemoved(false);
      toast.error(isApiError(err) ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  if (removed) return null;

  if (!item.couponSlug) {
    return (
      <li className="rounded-md border border-gray-100 bg-gray-50 p-4 text-xs text-cv-neutral-500">
        This coupon was removed from the catalog.
      </li>
    );
  }

  return (
    <li className="group relative overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cv-accent/30 hover:shadow-md">
      <button
        type="button"
        aria-label="Remove from saved"
        onClick={onRemove}
        disabled={busy}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-cv-neutral-400 opacity-0 shadow-sm ring-1 ring-black/5 transition hover:bg-cv-accent-soft hover:text-cv-accent group-hover:opacity-100 focus:opacity-100"
      >
        <BookmarkX className="h-4 w-4" aria-hidden />
      </button>

      <Link
        href={`/coupons/${item.couponSlug}`}
        className="flex h-full flex-col gap-2 p-5"
      >
        <p className="line-clamp-2 pr-10 text-base font-bold leading-snug tracking-tight text-gray-900 group-hover:text-cv-accent">
          {item.couponTitle ?? "(untitled)"}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {item.savingsLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cv-accent to-cv-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              {item.savingsLabel}
            </span>
          )}
          {item.couponStatus && item.couponStatus !== "ACTIVE" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
              {item.couponStatus}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-cv-neutral-400">
          <span>Saved {new Date(item.savedAt).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-0.5 font-semibold text-cv-accent opacity-0 transition group-hover:opacity-100">
            View
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}
