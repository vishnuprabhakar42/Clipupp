import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./config";

/**
 * next-intl routing. {@code as-needed} keeps EN at the root (no /en prefix)
 * and serves HI at /hi/... — the SEO-clean shape per architecture §11.2.
 */
export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
});
