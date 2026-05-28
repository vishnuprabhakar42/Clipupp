"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Filter, Tag, Truck, Store, X } from "lucide-react";
import type { CouponType } from "@/lib/api/types";
import type { CategoryOption } from "./StoreFilters";

const TYPE_OPTIONS: Array<{
  value: CouponType;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "CODE", label: "Codes", icon: <Tag className="h-3.5 w-3.5" aria-hidden /> },
  { value: "DEAL", label: "Deals", icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> },
  { value: "FREE_SHIPPING", label: "Free shipping", icon: <Truck className="h-3.5 w-3.5" aria-hidden /> },
  { value: "IN_STORE", label: "In-store", icon: <Store className="h-3.5 w-3.5" aria-hidden /> },
];

/**
 * URL-state filters for /coupons and /offers. All chips mutate the query
 * string and trigger a soft navigation (router.push without scroll) so the
 * server-rendered list refreshes without a full page reload. Active state
 * is read from the URL — no internal state drift.
 *
 * Category options now come from the server-fetched parent (a single
 * `tree()` call in the page) instead of useQuery here — this kills the
 * last React Query dependency on a public route so the provider can
 * move out of the root layout.
 */
export function CouponFilters({
  categories = [],
  showCategory = true,
}: {
  categories?: CategoryOption[];
  showCategory?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedTypes = new Set(search.getAll("types"));
  const activeCategory = search.get("category") ?? "";

  function commit(next: URLSearchParams) {
    next.delete("cursor"); // any filter change resets pagination
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function toggleType(value: CouponType) {
    const next = new URLSearchParams(search.toString());
    next.delete("types");
    const after = new Set(selectedTypes);
    if (after.has(value)) after.delete(value);
    else after.add(value);
    for (const t of after) next.append("types", t);
    commit(next);
  }

  function setCategory(slug: string) {
    const next = new URLSearchParams(search.toString());
    if (!slug) next.delete("category");
    else next.set("category", slug);
    commit(next);
  }

  function clearAll() {
    const next = new URLSearchParams(search.toString());
    next.delete("types");
    next.delete("category");
    commit(next);
  }

  const hasActive = selectedTypes.size > 0 || activeCategory !== "";

  return (
    <div className="sticky top-[4.5rem] z-20 -mx-4 mb-6 border-y bg-background/95 px-4 py-3 backdrop-blur lg:top-[7rem]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Filter className="h-3.5 w-3.5" aria-hidden />
          Filter
        </span>
        {TYPE_OPTIONS.map((opt) => {
          const active = selectedTypes.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleType(opt.value)}
              aria-pressed={active}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition " +
                (active
                  ? "border-cv-primary bg-cv-primary text-white shadow-sm"
                  : "border-border bg-background text-foreground/85 hover:bg-accent hover:text-foreground")
              }
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}

        {showCategory && categories.length > 0 && (
          <select
            value={activeCategory}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="ml-1 rounded-full border bg-background px-3 py-1 text-xs"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        )}

        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent"
          >
            <X className="h-3 w-3" aria-hidden />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
