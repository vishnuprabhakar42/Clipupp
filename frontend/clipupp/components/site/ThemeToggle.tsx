"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const BTN =
  "inline-flex h-11 w-11 items-center justify-center rounded-full text-clipupp-neutral-700 transition-colors hover:bg-clipupp-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary";

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("header");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Neutral placeholder until mounted so server and client markup match.
  if (!mounted) {
    return <span aria-hidden="true" className={cn("inline-block h-11 w-11", className)} />;
  }

  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? t("themeLight") : t("themeDark")}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(BTN, className)}
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
