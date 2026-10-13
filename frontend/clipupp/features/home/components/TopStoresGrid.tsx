import { getTranslations } from "next-intl/server";
import { StoreTile } from "@/features/catalog/components/StoreTile";
import { Link } from "@/lib/i18n/navigation";
import type { HomeFeed } from "@/lib/home/feed";
import { AllStoresExpander } from "./AllStoresExpander";
import { SectionHeader } from "./SectionHeader";

const DESKTOP = 12;
const COMPACT = 7;

/**
 * Top stores v3: 12 tiles at md+ and 7 below, each followed by an "All stores"
 * tile when more exist. All tiles render on the server; CSS (`.clipupp-stores`)
 * and the expander decide which show.
 */
export async function TopStoresGrid({ feed }: { feed: HomeFeed }) {
  const t = await getTranslations("home.stores");
  const stores = [...feed.stores].sort((a, b) => {
    if (a.popular != null && b.popular != null) return a.popular - b.popular;
    if (a.popular != null) return -1;
    if (b.popular != null) return 1;
    return a.name.localeCompare(b.name);
  });
  if (stores.length === 0) return null;
  const count = Math.max(feed.stats.storeCount, stores.length);
  return (
    <section id="stores" className="clipupp-container pt-8 sm:pt-12 lg:pt-16" aria-labelledby="stores-heading">
      <SectionHeader
        id="stores-heading"
        eyebrow={t("eyebrow", { count: new Intl.NumberFormat("en-IN").format(count) })}
        title={t("title")}
      />
      <AllStoresExpander total={stores.length} compact={COMPACT} desktop={DESKTOP}>
        {stores.map((s, i) => (
          <li key={s.id} data-tier={i >= DESKTOP ? "x" : i >= COMPACT ? "m" : undefined} className="min-w-0">
            <Link
              href={`/stores/${s.id}`}
              className="flex h-full min-w-0 flex-col items-center gap-1 rounded-[14px] border border-clipupp-neutral-200 bg-clipupp-surface px-1.5 py-3 text-center transition-[transform,box-shadow] duration-200 motion-reduce:transition-none lg:items-start lg:gap-1.5 lg:p-4 lg:text-left lg:hover:-translate-y-0.5 lg:hover:shadow-clipupp-hover motion-reduce:lg:hover:translate-y-0"
            >
              <StoreTile store={s} size={52} className="!h-[46px] !w-[46px] lg:!h-[52px] lg:!w-[52px]" />
              <b className="mt-1 line-clamp-2 w-full text-balance break-words text-[12.5px] font-semibold leading-snug text-clipupp-neutral-900 lg:mt-0 lg:line-clamp-1 lg:text-[16px]">
                {s.name}
              </b>
              <span className="text-[11.5px] text-clipupp-neutral-500 lg:text-[14px]">{t("coupons", { count: s.coupons })}</span>
              {s.best && (
                <span className="mt-auto hidden text-[14px] font-semibold text-clipupp-success lg:block">{s.best}</span>
              )}
            </Link>
          </li>
        ))}
      </AllStoresExpander>
    </section>
  );
}
