import { getTranslations } from "next-intl/server";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import { CouponCardLegacy } from "@/features/catalog/components/CouponCardLegacy";
import { SectionHeader } from "./SectionHeader";

/**
 * Block 2: horizontal snap rail of verified coupons, 4 cards plus a peek of
 * the next at 1440px. Native scroll, no JS. Images load lazily (the H1 is
 * the LCP element, so nothing here is preloaded). Returns null when empty so the
 * page never shows an empty band.
 */
export async function TrendingCouponsRail({ section }: { section: HomepageSectionPayload }) {
  const t = await getTranslations("home.sections");
  const coupons = section.coupons ?? [];
  if (coupons.length === 0) return null;
  return (
    <section className="clipupp-container py-12 lg:py-24" aria-labelledby="trending-heading">
      <SectionHeader id="trending-heading" eyebrow={section.subtitle} title={section.title} link={{ href: "/coupons", label: t("viewAllTrending") }} />
      <div className="clipupp-no-scrollbar -mx-4 grid snap-x snap-mandatory grid-flow-col auto-cols-[minmax(272px,1fr)] gap-6 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-[10px] lg:px-[10px]">
        {coupons.map((c, i) => (
          <div key={c.id} className="snap-start">
            <CouponCardLegacy coupon={c} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
