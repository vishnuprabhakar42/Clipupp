"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageCategoryTab } from "@/lib/api/homepage";
import { CouponCard } from "@/features/catalog/components/CouponCard";

/**
 * Block 4 tabs. Every tab's coupons arrive in the homepage payload, so
 * switching is a state change, no fetch. The row cards are server-safe
 * components rendered inside this client island (they contain no hooks).
 * Tab row scrolls horizontally on narrow screens with the underline sliding
 * via a CSS transition on the active button.
 */
export function TabbedCouponsClient({ tabs }: { tabs: HomepageCategoryTab[] }) {
  const t = useTranslations("home.sections");
  const id = useId();
  const [active, setActive] = useState(() => Math.max(0, tabs.findIndex((x) => x.coupons.length > 0)));
  const tab = tabs[active];
  if (!tab) return null;

  return (
    <div>
      <div role="tablist" aria-label="Coupon categories" className="clipupp-no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-clipupp-neutral-200">
        {tabs.map((x, i) => {
          const selected = i === active;
          return (
            <button key={x.slug} role="tab" id={`${id}-tab-${i}`} aria-selected={selected} aria-controls={`${id}-panel`}
              onClick={() => setActive(i)}
              className={
                "relative h-11 whitespace-nowrap px-4 text-[15px] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded after:bg-clipupp-primary after:transition-transform after:duration-200 after:content-[''] " +
                (selected ? "text-clipupp-primary after:scale-x-100" : "text-clipupp-neutral-700 after:scale-x-0 hover:text-clipupp-neutral-900")
              }>
              {x.title}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
        <div className="[&_.clipupp-reveal]:!opacity-100 [&_.clipupp-reveal]:!transform-none">
          {tab.coupons.length === 0 ? (
            <p className="rounded-xl border border-dashed border-clipupp-neutral-200 px-5 py-8 text-center text-[15px] text-clipupp-neutral-700">
              {t("emptyTab", { category: tab.title })}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tab.coupons.map((c, i) => (
                <CouponCard key={c.id} coupon={c} variant="row" index={i} />
              ))}
            </div>
          )}
        </div>
        <p className="mt-5">
          <Link href={`/categories/${tab.slug}`} className="text-[15px] font-medium text-clipupp-primary hover:underline">
            {t("seeAllCategory", { category: tab.title })} →
          </Link>
        </p>
      </div>
    </div>
  );
}
