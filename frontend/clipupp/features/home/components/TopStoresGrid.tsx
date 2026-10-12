import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import { SectionHeader } from "./SectionHeader";

/**
 * Block 3: 6 x 2 store tiles on desktop, 2 x 4 on mobile (the rest hidden
 * with a "View all" link). Each tile: 56px logo, name, live coupon count,
 * deal label in brand purple. `cashbackRate` is the repurposed deal label.
 */
export async function TopStoresGrid({ section }: { section: HomepageSectionPayload }) {
  const t = await getTranslations("home.sections");
  const stores = section.stores ?? [];
  if (stores.length === 0) return null;
  return (
    <section className="clipupp-container pb-12 lg:pb-24" aria-labelledby="stores-heading" id="stores">
      <SectionHeader eyebrow={section.subtitle} title={section.title} link={{ href: "/stores", label: t("browseAllStores") }} />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stores.map((s, i) => (
          <li key={s.id} className={i >= 8 ? "hidden lg:block" : undefined}>
            <Link href={`/stores/${s.slug}`}
              className="clipupp-reveal flex h-full min-w-0 flex-col items-start gap-2.5 rounded-xl border border-clipupp-neutral-200 bg-white px-4 py-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-clipupp-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{ "--i": Math.min(i, 5) } as React.CSSProperties}>
              <span className="grid h-14 w-14 place-items-center rounded-xl border border-clipupp-neutral-100 bg-white p-2">
                <Image src={s.logoUrl} alt="" width={56} height={56} priority={i < 6} className="h-full w-full object-contain" />
              </span>
              <b className="font-semibold leading-[1.3] text-clipupp-neutral-900 [overflow-wrap:anywhere]">{s.name}</b>
              <span className="text-[13px] tabular-nums text-clipupp-neutral-500">{t("couponsCount", { count: s.activeCouponCount ?? 0 })}</span>
              {s.cashbackRate && <span className="mt-auto text-[13px] font-medium text-clipupp-primary">{s.cashbackRate}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-5 lg:hidden">
        <Link href="/stores" className="text-[15px] font-medium text-clipupp-primary hover:underline">{t("viewAllStores", { count: 500 })} →</Link>
      </p>
    </section>
  );
}
