import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageCategoryTab } from "@/lib/api/homepage";
import { CouponCard } from "@/features/catalog/components/CouponCard";
import { TabSwitcher } from "./TabSwitcher";

/**
 * Block 4 tabs. Every tab's coupons arrive in the homepage payload; each
 * panel is rendered here on the server and handed to the small TabSwitcher
 * island, which only toggles visibility. The tab row scrolls horizontally on
 * narrow screens with the underline sliding via a CSS transition.
 */
export async function TabbedCoupons({ tabs }: { tabs: HomepageCategoryTab[] }) {
  if (tabs.length === 0) return null;
  const t = await getTranslations("home.sections");
  const initial = Math.max(0, tabs.findIndex((x) => x.coupons.length > 0));

  return (
    <TabSwitcher tabs={tabs.map(({ slug, title }) => ({ slug, title }))} initial={initial} label={t("tabsLabel")}>
      {tabs.map((tab) => (
        <div key={tab.slug}>
          {/* Panels can be shown long after the scroll observer ran, so their
              cards skip the reveal-hidden state. */}
          <div className="[&_.clipupp-reveal]:!opacity-100 [&_.clipupp-reveal]:!transform-none [&_.clipupp-reveal]:!animate-none">
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
      ))}
    </TabSwitcher>
  );
}
