"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/config";

// Display labels for each supported locale. Native script for each language
// is the convention - Wikipedia, Google etc. all do this.
const LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/**
 * Locale switcher - uses next-intl's locale-aware router so the URL
 * actually changes to /hi/<path> (or strips /hi when switching back to
 * English). This is the right pattern for SEO hreflang: each locale has a
 * distinct, canonical URL that crawlers can index independently.
 *
 * Variants:
 *   `pill` - labeled chip with globe icon; used inside the header desktop.
 *   `segmented` - two-button English | हिन्दी group for the dark footer.
 *   `icon` - globe-only square button; used in the mobile bottom nav.
 */
export function LocaleSwitcher({
  variant = "pill",
  align = "end",
}: {
  variant?: "pill" | "icon" | "segmented";
  align?: "start" | "end";
}) {
  const t = useTranslations("chrome");
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

  if (variant === "segmented") {
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
            {LABELS[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <button
            type="button"
            aria-label={t("changeLanguage")}
            disabled={isPending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-clipupp-neutral-600 transition-colors hover:bg-clipupp-neutral-100 hover:text-clipupp-neutral-900 disabled:opacity-40"
          >
            <Globe className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label={t("changeLanguage")}
            disabled={isPending}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-clipupp-neutral-700 transition-colors hover:bg-clipupp-neutral-100 hover:text-clipupp-neutral-900 disabled:opacity-40"
          >
            <Globe className="h-4 w-4" aria-hidden />
            <span>{LABELS[locale]}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchTo(loc)}
            className={loc === locale ? "font-semibold text-clipupp-primary" : undefined}
          >
            <Globe className="mr-2 h-3.5 w-3.5" aria-hidden />
            {LABELS[loc]}
            {loc === "hi" && (
              <span className="ml-auto rounded-sm bg-clipupp-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-clipupp-accent-strong">
                {t("beta")}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
