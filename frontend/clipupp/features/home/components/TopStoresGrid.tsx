import { getTranslations } from "next-intl/server";
import { StoreTile } from "@/features/catalog/components/StoreTile";
import { Link } from "@/lib/i18n/navigation";
import type { HomeFeed } from "@/lib/home/feed";
import { storeRows } from "@/lib/home/storeRows";
import { AllStoresExpander } from "./AllStoresExpander";
import { SectionHeader } from "./SectionHeader";

/**
 * Top stores v3: two full grid rows (8 cells below md, 12 from md). When the
 * stores do not fit, the last cell is an "All stores" tile. All tiles render
 * on the server; CSS (`.clipupp-stores`) and the expander decide which show.
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
  const { phone, wide } = storeRows(stores.length);
  return (
    <section id="stores" className="clipupp-container pt-10 md:pt-14 lg:pt-[72px]" aria-labelledby="stores-heading">
      <SectionHeader
        id="stores-heading"
        eyebrow={t("eyebrow", { count: new Intl.NumberFormat("en-IN").format(stores.length) })}
        title={t("title")}
      />
      <AllStoresExpander total={stores.length} phone={phone} wide={wide}>
        {stores.map((s, i) => (
          <li key={s.id} data-tier={i >= wide ? "x" : i >= phone ? "m" : undefined} className="min-w-0">
            <Link
              href={`/stores/${s.id}`}
              className="clipupp-hl flex h-full min-w-0 flex-col items-center gap-1 rounded-[14px] border border-clipupp-neutral-200 bg-clipupp-surface px-1.5 py-3 text-center transition-[transform,box-shadow] duration-200 motion-reduce:transition-none lg:items-start lg:gap-1.5 lg:p-4 lg:text-left lg:hover:-translate-y-0.5 lg:hover:shadow-clipupp-hover motion-reduce:lg:hover:translate-y-0"
            >
              <StoreTile store={s} size={52} className="!h-[46px] !w-[46px] lg:!h-[52px] lg:!w-[52px]" />
              <b className="mt-1 line-clamp-2 w-full text-balance break-words text-[12.5px] font-semibold leading-snug text-clipupp-neutral-900 lg:mt-0 lg:line-clamp-1 lg:text-[16px]">
                {s.name}
              </b>
              <span className="text-[11.5px] text-clipupp-neutral-500 lg:text-[14px]">{t("coupons", { count: s.coupons })}</span>
              {s.best && (
                // Phone tiles are about 70px wide: two balanced lines read where one would clip to "Up t...".
                <span className="mt-auto line-clamp-2 w-full text-balance break-words text-[11.5px] font-semibold leading-tight text-clipupp-success lg:line-clamp-1 lg:text-[14px] lg:leading-normal">
                  {s.best}
                </span>
              )}
            </Link>
          </li>
        ))}
      </AllStoresExpander>
    </section>
  );
}
