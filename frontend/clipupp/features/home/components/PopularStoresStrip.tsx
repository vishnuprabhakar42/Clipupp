import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { FeedStore } from "@/lib/home/feed";
import { LogoImage } from "@/features/catalog/components/LogoImage";
import { displayShortName } from "@/lib/home/storeName";

const mono = (s: FeedStore) => (
  <span
    aria-hidden
    className="grid h-[62px] w-[62px] place-items-center rounded-full text-[17px] font-bold shadow-card transition-transform group-hover:-translate-y-0.5 lg:h-[72px] lg:w-[72px] lg:text-[20px]"
    style={{ background: s.bg, color: s.fg }}
  >
    {s.mono}
  </span>
);

/** Round logos of the popular stores, ranked by `popular`. */
export async function PopularStoresStrip({ stores }: { stores: FeedStore[] }) {
  const t = await getTranslations("home.popularStores");
  const items = stores.filter((s) => s.popular != null).sort((a, b) => (a.popular ?? 0) - (b.popular ?? 0));
  if (items.length < 4) return null;
  return (
    <section aria-label={t("aria")} className="clipupp-container pt-7 sm:pt-10 lg:pt-14">
      <ul className="clipupp-no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:gap-3 lg:px-0">
        {items.map((s) => (
          <li key={s.id} className="w-[68px] shrink-0 lg:w-[84px]">
            <Link href={`/stores/${s.id}`} className="group flex flex-col items-center gap-2">
              {s.logo ? (
                <LogoImage
                  src={s.logo}
                  width={72}
                  height={72}
                  sizes="72px"
                  className="h-full w-full object-contain"
                  frameClassName="grid h-[62px] w-[62px] place-items-center overflow-hidden rounded-full bg-clipupp-logo-bg p-3 shadow-card transition-transform group-hover:-translate-y-0.5 lg:h-[72px] lg:w-[72px] lg:p-3.5"
                  fallback={mono(s)}
                />
              ) : (
                mono(s)
              )}
              <span className="w-full truncate text-center text-[12px] text-clipupp-neutral-700 lg:text-[13px]">{displayShortName(s.name)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
