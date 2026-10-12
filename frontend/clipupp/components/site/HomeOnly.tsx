"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/lib/i18n/navigation";

/** Renders children only on the homepage (locale-aware pathname "/"). */
export function HomeOnly({ children }: { children: ReactNode }) {
  return usePathname() === "/" ? <>{children}</> : null;
}
