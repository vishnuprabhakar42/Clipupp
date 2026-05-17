/**
 * Phase 1 locales. EN is the default (no URL prefix); HI lives at `/hi/...`.
 * Phase 2 adds ES, FR, AR — extending this array + adding a messages file is
 * all that's required (the next-intl middleware picks them up automatically).
 */
export const locales = ["en", "hi"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Locale → IETF lang tag for `<html lang>`. */
export const localeToBcp47: Record<Locale, string> = {
  en: "en",
  hi: "hi-IN",
};

/** Locales that require RTL layout direction. None in Phase 1. */
export const rtlLocales: ReadonlyArray<Locale> = [];

export function isLocale(value: string): value is Locale {
  return (locales as ReadonlyArray<string>).includes(value);
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}
