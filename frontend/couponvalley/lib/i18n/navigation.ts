import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware Link / redirect / usePathname / useRouter. Use these in place
 * of the next/link defaults whenever you're rendering an internal URL inside
 * the localized route tree, so that the active locale is preserved when the
 * user follows the link.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
