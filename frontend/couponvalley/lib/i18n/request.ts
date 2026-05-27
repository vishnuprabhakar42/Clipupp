import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * next-intl request config — loads the locale's messages with English
 * fallback. Any key missing from messages/<locale>.json silently falls back
 * to the English string instead of throwing. This is required for the
 * Hindi-beta strategy: Hindi can ship partially-translated and the page
 * still renders without runtime errors.
 *
 * Deep-merge so nested namespaces (e.g. metadata.homepage.title) fall
 * through too — a shallow Object.assign would lose keys inside missing
 * sub-objects.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale =
    requested && isLocale(requested) ? requested : defaultLocale;

  const localeMessages = (await import(`../../messages/${locale}.json`))
    .default as Record<string, unknown>;

  if (locale === defaultLocale) {
    return { locale, messages: localeMessages };
  }

  // For non-default locales, load EN as the fallback layer.
  const fallbackMessages = (await import(`../../messages/${defaultLocale}.json`))
    .default as Record<string, unknown>;

  return {
    locale,
    messages: deepMerge(fallbackMessages, localeMessages),
  };
});

/**
 * Deep-merge two plain-object trees. The override (right) wins for leaf
 * conflicts; objects in the override merge into objects in the base; arrays
 * and primitives in the override fully replace the base value. Used to
 * layer locale messages on top of English fallback messages.
 */
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, ovValue] of Object.entries(override)) {
    const baseValue = out[key];
    if (isPlainObject(baseValue) && isPlainObject(ovValue)) {
      out[key] = deepMerge(
        baseValue as Record<string, unknown>,
        ovValue as Record<string, unknown>
      );
    } else {
      out[key] = ovValue;
    }
  }
  return out;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
