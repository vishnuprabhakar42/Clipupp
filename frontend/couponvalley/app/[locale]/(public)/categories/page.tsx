import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { categoriesApi } from "@/lib/api/categories";
import { isApiError } from "@/lib/api/errors";
import { canonicalFor, hreflangAlternates } from "@/lib/seo/urls";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 60;

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.categories" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalFor("/categories", locale),
      languages: hreflangAlternates("/categories"),
    },
  };
}

export default async function CategoriesPage({
  params,
}: {
  params: Params;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "categories" });

  let tree: Awaited<ReturnType<typeof categoriesApi.tree>> = [];
  let hadError = false;
  try {
    tree = await categoriesApi.tree();
  } catch (err) {
    hadError = !(isApiError(err) && err.status === 404);
  }

  return (
    <div className="container py-8 md:py-12">
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <h1 className="cv-gradient-text text-3xl font-bold tracking-tight md:text-4xl">
          {t("listTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("listSubtitle")}</p>
      </header>

      {hadError ? (
        <p className="text-sm text-destructive">{t("loadError")}</p>
      ) : tree.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Tile backgrounds cycle through 4 brand-role soft tints (primary,
              accent, success, neutral). Danger is skipped — destructive red
              isn't a decorative colour. Adjacent tiles may repeat; tiles are
              also distinguished by category title so the repeat is fine. */}
          {tree.map((cat, i) => (
            <li
              key={cat.id}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                background: ["var(--cv-primary-soft)", "var(--cv-accent-soft)", "var(--cv-success-soft)", "var(--cv-neutral-100)"][i % 4],
              }}
            >
              <Link
                href={`/categories/${cat.slug}`}
                className="truncate text-base font-bold text-cv-primary hover:underline"
              >
                {cat.title}
              </Link>
              {cat.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {cat.description}
                </p>
              )}
              {cat.children.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {cat.children.slice(0, 6).map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-cv-primary ring-1 ring-cv-primary/10 transition hover:bg-white"
                      >
                        {child.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/categories/${cat.slug}`}
                className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-md bg-cv-primary px-3 py-2 pt-2 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-cv-primary-strong"
              >
                View deals →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
