import { getTranslations } from "next-intl/server";
import { Instagram, Youtube, Facebook, Linkedin, ShieldCheck, Tag, Store as StoreIcon } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Logo } from "@/components/site/Logo";
import { LocaleSegmented } from "@/components/site/LocaleSegmented";
import { FooterColumn } from "@/components/site/FooterColumn";
import { CopyEmailButton } from "@/components/site/CopyEmailButton";
import { BackToTop } from "@/components/site/BackToTop";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import { rootCategories, shortCategoryLabel } from "@/lib/home/categoryLabel";
import type { HomeFeed } from "@/lib/home/feed";
import { anchorFor, renderedAnchors } from "@/lib/home/anchors";

const LINK =
  "block rounded py-1.5 text-[14px] text-clipupp-ft-ink-2 lg:py-[5px] transition-colors hover:text-clipupp-ft-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-ft-accent";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_ICON: Record<HomeFeed["social"][number]["network"], { label: string; icon: React.ReactNode }> = {
  instagram: { label: "Instagram", icon: <Instagram className="h-4 w-4" aria-hidden /> },
  youtube: { label: "YouTube", icon: <Youtube className="h-4 w-4" aria-hidden /> },
  x: { label: "X", icon: <XIcon /> },
  facebook: { label: "Facebook", icon: <Facebook className="h-4 w-4" aria-hidden /> },
  linkedin: { label: "LinkedIn", icon: <Linkedin className="h-4 w-4" aria-hidden /> },
};

/** Drops links whose target is null (a homepage block that is not rendered and has no route). */
function withHref(links: [string | null, string][]): [string, string][] {
  return links.filter((l): l is [string, string] => l[0] != null);
}

/** Footer v3: fixed deep-purple look in both themes. Server component; interactivity lives in small client leaves. */
export async function Footer() {
  const [t, feed] = await Promise.all([getTranslations("footer"), getHomeFeed()]);
  const year = new Date().getFullYear();
  const topStores = feed.stores
    .filter((s) => s.popular != null && s.popular <= 8)
    .sort((a, b) => (a.popular ?? 0) - (b.popular ?? 0))
    .slice(0, 8);
  const cats = rootCategories(feed.categories).filter((c) => !c.hot).slice(0, 8);
  const storeCount = Math.max(feed.stats.storeCount, feed.stores.length) || 500;

  const trust = [
    { icon: <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />, title: t("trustVerifyTitle"), body: t("trustVerifyBody") },
    { icon: <Tag className="h-[18px] w-[18px]" aria-hidden />, title: t("trustFreeTitle"), body: t("trustFreeBody") },
    { icon: <StoreIcon className="h-[18px] w-[18px]" aria-hidden />, title: t("trustStoresTitle", { count: storeCount }), body: t("trustStoresBody") },
  ];
  // Homepage blocks link in-page only when they render; otherwise their route, or nothing.
  const rendered = renderedAnchors(feed);
  const alertsHref = anchorFor("alerts", rendered);
  const company = withHref([
    [anchorFor("verify", rendered), t("howWeVerify")],
    [anchorFor("calendar", rendered), t("saleCalendar")],
    [anchorFor("bank", rendered), t("bankOffers")],
    [alertsHref, t("dealAlerts")],
    ["/about", t("aboutUs")],
    ["/blog", t("blog")],
  ]);
  const help = withHref([
    [anchorFor("faq", rendered), t("helpFaq")],
    ["/contact", t("contact")],
    ["/privacy", t("privacy")],
    ["/terms", t("terms")],
    ["/affiliate-disclosure", t("affiliate")],
    ["/cookie-policy", t("cookies")],
  ]);

  return (
    <footer role="contentinfo" className="bg-clipupp-ft-bg text-clipupp-ft-ink">
      <div className="clipupp-container py-7 lg:py-10">
        <ul className="grid gap-4 border-b border-[color:var(--clipupp-ft-line)] pb-6 sm:grid-cols-3 sm:gap-6">
          {trust.map((x) => (
            <li key={x.title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-clipupp-ft-card text-clipupp-gold">{x.icon}</span>
              <span className="min-w-0">
                <b className="block text-[14.5px] font-semibold text-clipupp-ft-ink">{x.title}</b>
                <span className="mt-1 block text-[13px] text-clipupp-ft-ink-2">{x.body}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="grid gap-x-6 gap-y-6 pt-7 md:grid-cols-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div className="md:col-span-4 lg:col-span-1">
            <Logo variant="on-dark" height={72} priority={false} className="-mb-7 -mt-5" />
            <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-clipupp-ft-ink-2">{t("about")}</p>
            {feed.social.length > 0 && (
              <ul className="mt-4 flex gap-2.5">
                {feed.social.map((s) => {
                  const m = SOCIAL_ICON[s.network];
                  return (
                    <li key={s.network}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener"
                        aria-label={t("socialAria", { network: m.label })}
                        className="grid h-[42px] w-[42px] place-items-center rounded-full bg-clipupp-ft-card text-clipupp-ft-ink-2 transition-colors hover:text-clipupp-ft-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-ft-accent"
                      >
                        {m.icon}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            {alertsHref && (
              <Link
                href={alertsHref}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-clipupp-success px-4 text-[14px] font-semibold text-clipupp-success-fg transition-colors hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-ft-accent"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M21.9 4.4 18.7 19.5c-.2 1-.9 1.3-1.7.8l-4.8-3.6-2.3 2.3c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.5 13 1.8 11.5c-1-.3-1-1 .2-1.5L20.4 3c.9-.3 1.7.2 1.5 1.4Z" />
                </svg>
                {t("telegramPill")}
              </Link>
            )}
          </div>

          <FooterColumn title={t("topStores")}>
            {topStores.map((s) => (
              <li key={s.id}><Link href={`/stores/${s.id}`} className={LINK}>{s.name}</Link></li>
            ))}
          </FooterColumn>
          <FooterColumn title={t("categories")}>
            {cats.map((c) => (
              <li key={c.id}><Link href={`/categories/${c.id}`} className={LINK}>{shortCategoryLabel(c.name)}</Link></li>
            ))}
          </FooterColumn>
          <FooterColumn title={t("company")}>
            {company.map(([href, label]) => (
              <li key={label}><Link href={href} className={LINK}>{label}</Link></li>
            ))}
          </FooterColumn>
          <FooterColumn title={t("helpLegal")}>
            {help.map(([href, label]) => (
              <li key={label}><Link href={href} className={LINK}>{label}</Link></li>
            ))}
          </FooterColumn>
        </div>

        {feed.partnerEmail && (
          <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-clipupp-ft-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <b className="font-display text-[17px] font-semibold text-clipupp-ft-ink">{t("partnerTitle")}</b>
              <p className="mt-1 text-[14px] text-clipupp-ft-ink-2">{t("partnerBody")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <code id="partner-email" className="select-all font-sans text-[15px] font-semibold text-clipupp-ft-accent">{feed.partnerEmail}</code>
              <CopyEmailButton email={feed.partnerEmail} targetId="partner-email" />
            </div>
          </div>
        )}

        {feed.popularSearches.length > 0 && (
          <nav aria-labelledby="ft-searches" className="mt-7">
            <h2 id="ft-searches" className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-clipupp-ft-ink">{t("popularSearches")}</h2>
            <ul className="flex flex-wrap">
              {feed.popularSearches.map((s) => (
                <li key={s.label} className="after:mx-3 after:inline-block after:h-3 after:w-px after:bg-[color:var(--clipupp-ft-line)] after:align-middle after:content-[''] last:after:hidden">
                  <Link href={s.href} className="inline-block rounded py-1.5 text-[13px] text-clipupp-ft-ink-2 hover:text-clipupp-ft-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-ft-accent">{s.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <p className="mt-6 max-w-[88ch] text-[13px] leading-relaxed text-clipupp-ft-ink-3">{t("disclosure")}</p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--clipupp-ft-line)] pt-6">
          <span className="text-[13px] text-clipupp-ft-ink-3">{t("copyright", { year })}</span>
          <LocaleSegmented />
          <BackToTop label={t("backToTop")} />
        </div>
      </div>
    </footer>
  );
}
