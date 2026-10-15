"use client";

import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales } from "@/lib/i18n/config";
import { LOCALE_LABELS as LABELS, useSwitchLocale } from "@/components/site/LocaleSegmented";

/**
 * Locale switcher - uses next-intl's locale-aware router so the URL
 * actually changes to /hi/<path> (or strips /hi when switching back to
 * English). This is the right pattern for SEO hreflang: each locale has a
 * distinct, canonical URL that crawlers can index independently.
 *
 * The footer's two-button group is `LocaleSegmented`, kept in its own file so
 * it does not pull Radix into the first-load bundle.
 *
 * Variants:
 *   `pill` - labeled chip with globe icon; used inside the header desktop.
 *   `icon` - globe-only square button; used in the mobile bottom nav.
 */
export function LocaleSwitcher({
  variant = "pill",
  align = "end",
}: {
  variant?: "pill" | "icon";
  align?: "start" | "end";
}) {
  const t = useTranslations("chrome");
  const { locale, isPending, switchTo } = useSwitchLocale();

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
