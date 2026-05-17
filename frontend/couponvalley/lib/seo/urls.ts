import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

/** Site URL with no trailing slash. */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/** Canonical URL for a path under the given locale. EN has no prefix. */
export function canonicalFor(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return `${siteUrl()}${clean}`;
  return `${siteUrl()}/${locale}${clean}`;
}

/**
 * Hreflang map for a path. Includes every supported locale plus an
 * x-default pointing at the EN canonical (the default locale's URL).
 */
export function hreflangAlternates(path: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const loc of locales) {
    map[loc] = canonicalFor(path, loc);
  }
  map["x-default"] = canonicalFor(path, defaultLocale);
  return map;
}
