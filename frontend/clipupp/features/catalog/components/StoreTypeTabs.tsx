"use client";

import { useState, useMemo } from "react";
import type { CouponSummary, CouponType } from "@/lib/api/types";
import { storesApi } from "@/lib/api/stores";
import { CouponSavingsRowCard } from "./CouponSavingsRowCard";

type TabId = "ALL" | CouponType;

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "ALL", label: "All Offers" },
  { id: "CODE", label: "Codes" },
  { id: "DEAL", label: "Deals" },
  { id: "FREE_SHIPPING", label: "Free Shipping" },
  { id: "IN_STORE", label: "In-Store" },
];

const PAGE_SIZE = 24;

export function StoreTypeTabs({
  storeSlug,
  initialCoupons,
  initialHasMore,
}: {
  storeSlug: string;
  initialCoupons: CouponSummary[];
  initialHasMore: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("ALL");
  const [coupons, setCoupons] = useState(initialCoupons);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextPage, setNextPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(
    () => (activeTab === "ALL" ? coupons : coupons.filter((c) => c.type === activeTab)),
    [coupons, activeTab],
  );

  const counts = useMemo(() => {
    const m: Partial<Record<TabId, number>> = { ALL: coupons.length };
    for (const c of coupons) {
      m[c.type] = (m[c.type] ?? 0) + 1;
    }
    return m;
  }, [coupons]);

  const visibleTabs = TABS.filter((t) => t.id === "ALL" || (counts[t.id] ?? 0) > 0);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const result = await storesApi.coupons(storeSlug, nextPage, PAGE_SIZE);
      setCoupons((prev) => [...prev, ...result.data]);
      setHasMore(result.page.hasMore);
      setNextPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Type filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-100 pb-5">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-clipupp-primary text-white"
                : "bg-clipupp-neutral-100 text-clipupp-neutral-700 hover:bg-clipupp-primary-soft hover:text-clipupp-primary"
            }`}
          >
            {tab.label}
            {counts[tab.id] != null && (
              <span
                className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold leading-none ${
                  activeTab === tab.id
                    ? "bg-white/25 text-white"
                    : "bg-white text-gray-500 shadow-sm"
                }`}
              >
                {counts[tab.id]}
                {hasMore && tab.id === "ALL" ? "+" : ""}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Coupon list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-clipupp-primary-soft">
            <span className="text-2xl">🏷️</span>
          </div>
          <p className="font-semibold text-gray-700">No offers found</p>
          <p className="text-sm text-gray-400">
            No{activeTab !== "ALL" ? ` ${tab_label(activeTab).toLowerCase()}` : ""} offers available yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((c) => (
            <li key={c.id}>
              <CouponSavingsRowCard coupon={c} />
            </li>
          ))}
        </ul>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-clipupp-primary py-3.5 text-sm font-bold text-clipupp-primary transition hover:bg-clipupp-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-clipupp-primary border-t-transparent" />
              Loading more offers…
            </>
          ) : (
            "Load more offers"
          )}
        </button>
      )}
    </div>
  );
}

function tab_label(id: CouponType): string {
  switch (id) {
    case "CODE": return "Code";
    case "DEAL": return "Deal";
    case "FREE_SHIPPING": return "Free Shipping";
    case "IN_STORE": return "In-Store";
  }
}
