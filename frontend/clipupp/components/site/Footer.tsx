import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Logo } from "@/components/site/Logo";
import { categoriesApi } from "@/lib/api/categories";
import { storesApi } from "@/lib/api/stores";

/**
 * Footer (spec block 7). White, four full-scope link columns, wordmark with a
 * one-line description, bottom row with copyright and the language label.
 * Links are full-scope ("Fashion coupons", never "Fashion") for SEO and
 * screen readers.
 */
export async function Footer() {
  const [t, categoryTree, storesPage] = await Promise.all([
    getTranslations("footer"),
    categoriesApi.tree().catch(() => null),
    storesApi.list({ limit: 4 }).catch(() => null),
  ]);
  const categories = (categoryTree ?? []).slice(0, 5);
  const stores = storesPage?.data?.slice(0, 3) ?? [];
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-clipupp-neutral-200 bg-white" role="contentinfo">
      <div className="clipupp-container pb-8 pt-14">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]">
          <div>
            <Logo height={30} />
            <p className="mt-3 max-w-[32ch] text-[14px] text-clipupp-neutral-700">{t("blurb")}</p>
          </div>
          <FooterColumn title={t("coupons")}>
            {categories.map((c) => (
              <FooterLink key={c.id} href={`/categories/${c.slug}`}>{t("nameCoupons", { name: c.title })}</FooterLink>
            ))}
          </FooterColumn>
          <FooterColumn title={t("stores")}>
            <FooterLink href="/stores">{t("storesAZ")}</FooterLink>
            {stores.map((s) => (
              <FooterLink key={s.id} href={`/stores/${s.slug}`}>{t("nameCoupons", { name: s.name })}</FooterLink>
            ))}
          </FooterColumn>
          <FooterColumn title={t("company")}>
            <FooterLink href="/#verify">{t("howWeVerify")}</FooterLink>
            <FooterLink href="/blog">{t("blog")}</FooterLink>
            <FooterLink href="/how-it-works">{t("faq")}</FooterLink>
            <FooterLink href="/about">{t("about")}</FooterLink>
          </FooterColumn>
          <FooterColumn title={t("legal")}>
            <FooterLink href="/privacy">{t("privacy")}</FooterLink>
            <FooterLink href="/terms">{t("terms")}</FooterLink>
            <FooterLink href="/affiliate-disclosure">{t("disclosure")}</FooterLink>
          </FooterColumn>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-clipupp-neutral-100 pt-6 text-[13px] text-clipupp-neutral-500">
          <span>{t("copyright", { year })}</span>
          <span>{t("language")}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3.5 text-[12px] font-medium uppercase tracking-[0.04em] text-clipupp-neutral-500">{title}</h4>
      <ul className="space-y-0">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="block py-1.5 text-[14px] text-clipupp-neutral-700 hover:text-clipupp-primary">
        {children}
      </Link>
    </li>
  );
}
