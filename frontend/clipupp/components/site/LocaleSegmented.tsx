"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/config";

// Display labels for each supported locale. Native script for each language
// is the convention - Wikipedia, Google etc. all do this.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/** Switches through next-intl's locale-aware router, so the URL changes to /hi/<path> (or drops /hi). */
export function useSwitchLocale() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return { locale, isPending, switchTo };
}

/** Two-button English | हिन्दी group for the dark footer. No Radix, so it is cheap to ship on every page. */
export function LocaleSegmented() {
  const t = useTranslations("chrome");
  const { locale, isPending, switchTo } = useSwitchLocale();
  return (
    <div role="group" aria-label={t("language")} className="inline-flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          lang={loc}
          aria-pressed={loc === locale}
          disabled={isPending}
          onClick={() => switchTo(loc)}
          className={`h-8 rounded-full px-3 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-ft-accent disabled:opacity-60 ${
            loc === locale ? "bg-white/10 text-clipupp-ft-ink" : "text-clipupp-ft-ink-2 hover:text-clipupp-ft-ink"
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
