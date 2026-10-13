"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Account dropdown, loaded by the header's avatar button on first pointer
 * down or focus so Radix and floating-ui stay out of the first-load bundle.
 */
export function UserMenuPanel({
  initial,
  triggerClassName,
  defaultOpen,
  autoFocus,
}: {
  initial: string;
  triggerClassName: string;
  /** The placeholder button was clicked before this loaded. */
  defaultOpen: boolean;
  /** The placeholder button had focus; move it to the real trigger. */
  autoFocus: boolean;
}) {
  const auth = useAuth();
  const t = useTranslations("header");
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus && !defaultOpen) triggerRef.current?.focus();
    // Only on mount: hands focus over from the placeholder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!auth.user) return null;
  const { name, email, roles } = auth.user;
  const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");

  async function handleLogout() {
    await auth.logout();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>
        <button ref={triggerRef} type="button" className={triggerClassName} aria-label={t("openAccountMenu")}>
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {name && <span className="truncate text-sm font-medium">{name}</span>}
          <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/account">{t("overview")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/saved-coupons">{t("savedCoupons")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/click-history">{t("clickHistory")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/profile">{t("profile")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/account/preferences">{t("preferences")}</Link></DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/admin">{t("adminDashboard")}</Link></DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
