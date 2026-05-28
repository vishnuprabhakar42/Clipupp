"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { type Locale, locales as supportedLocales } from "@/lib/i18n/config";

export type Language = Locale;

/**
 * Phase 1 compatibility shim. The legacy LanguageProvider exposed `t(key)`
 * and `language` / `setLanguage()` to a dozen marketing components built
 * before next-intl. Sprint 3 keeps those callers untouched by re-exporting
 * the same surface area on top of next-intl.
 *
 * <p>Future sprints will gradually migrate components to {@code useTranslations}
 * directly with namespaced keys. Once nothing imports {@code useLanguage}, this
 * shim and {@code components/language-toggle.tsx} can be deleted.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  // No-op: NextIntlClientProvider in app/[locale]/layout.tsx provides the
  // actual translation context. This wrapper exists only so the legacy
  // import path keeps resolving.
  return <>{children}</>;
}

export function useLanguage() {
  const t = useTranslations("legacy");
  const language = useLocale() as Language;
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const setLanguage = (next: Language) => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return { t, language, setLanguage, locales: supportedLocales };
}
