"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
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
// is the convention — Wikipedia, Google etc. all do this.
const LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/**
 * Locale switcher — uses next-intl's locale-aware router so the URL
 * actually changes to /hi/<path> (or strips /hi when switching back to
 * English). This is the right pattern for SEO hreflang: each locale has a
 * distinct, canonical URL that crawlers can index independently.
 *
 * Variants:
 *   `pill` — labeled chip with globe icon; used inside the header desktop.
 *   `icon` — globe-only square button; used in the mobile bottom nav.
 */
export function LocaleSwitcher({
  variant = "pill",
  align = "end",
}: {
  variant?: "pill" | "icon";
  align?: "start" | "end";
}) {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <button
            type="button"
            aria-label="Change language"
            disabled={isPending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-cv-neutral-600 transition-colors hover:bg-cv-neutral-100 hover:text-cv-neutral-900 disabled:opacity-40"
          >
            <Globe className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Change language"
            disabled={isPending}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-cv-neutral-700 transition-colors hover:bg-cv-neutral-100 hover:text-cv-neutral-900 disabled:opacity-40"
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
            className={loc === locale ? "font-semibold text-cv-primary" : undefined}
          >
            <Globe className="mr-2 h-3.5 w-3.5" aria-hidden />
            {LABELS[loc]}
            {loc === "hi" && (
              <span className="ml-auto rounded-sm bg-cv-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-cv-accent-strong">
                Beta
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
