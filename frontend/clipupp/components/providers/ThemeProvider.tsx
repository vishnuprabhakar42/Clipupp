"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "@/lib/i18n/navigation";

/**
 * Only the homepage has a dark palette so far. Every other route is forced to
 * light (next-themes `forcedTheme`) until it is migrated: this re-scopes the
 * tokens on <html>, so portals and the body background stay light too. To
 * migrate a route, add its pathname to THEMED_PATHS.
 */
const THEMED_PATHS = new Set(["/"]);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const forcedTheme = THEMED_PATHS.has(pathname) ? undefined : "light";
  return (
    <NextThemesProvider
      attribute="data-theme"
      storageKey="clipupp:theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
