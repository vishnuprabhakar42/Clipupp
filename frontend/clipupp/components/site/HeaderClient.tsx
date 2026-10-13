"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bell, Heart, LogOut, User } from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { CategoriesMenu, type MenuCategory } from "@/components/site/CategoriesMenu";
import { HeaderSearch, type HeaderSearchFeed } from "@/features/catalog/components/HeaderSearch";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMergeSavedOnLogin, useSavedCount } from "@/lib/home/useSavedCoupons";
import { useSavedSheet } from "@/lib/home/useSavedSheet";
import { anchorFor, type HomeAnchor } from "@/lib/home/anchors";

export type HeaderFeed = {
  categories: MenuCategory[];
  totalCoupons: number;
  search: HeaderSearchFeed;
  /** Homepage anchors that render, so header links never point at a missing block. */
  anchors: HomeAnchor[];
};

const LOGO_SIZE = "!h-[47px] !w-[103px] lg:!h-[65px] lg:!w-[143px]";

const ICON_BTN =
  "relative inline-flex h-11 w-11 items-center justify-center rounded-full text-clipupp-neutral-700 transition-colors hover:bg-clipupp-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary";

/**
 * Site header. One DOM, two layouts via grid areas: phone is two rows
 * (logo + actions 58px, search 56px, row 1 collapses on scroll-down), lg+ is
 * one 72px row (logo, search, actions).
 */
export function HeaderClient({ feed }: { feed: HeaderFeed }) {
  const t = useTranslations("header");
  useMergeSavedOnLogin();
  useCollapseOnScroll();
  const alertsHref = anchorFor("alerts", feed.anchors);

  return (
    <header
      role="banner"
      className="clipupp-hdr sticky top-[env(safe-area-inset-top)] z-sticky w-full border-b border-clipupp-neutral-200 bg-clipupp-surface"
    >
      <div className="clipupp-container grid grid-cols-[auto_1fr] grid-rows-[58px_56px] items-center [grid-template-areas:'logo_actions'_'search_search'] lg:grid-cols-[auto_minmax(0,560px)_1fr] lg:grid-rows-[72px] lg:gap-x-7 lg:[grid-template-areas:'logo_search_actions']">
        <div className="[grid-area:logo]">
          {/* The artwork has built-in padding (glyphs are 96% of the width, 65% of the height):
              47px / 65px image heights give ~98px / ~136px wide wordmarks like the design.
              Widths are the 1151:525 aspect rounded (103 / 143, the lg pair equals the
              attributes). Only the light variant is preloaded; the dark one loads when shown. */}
          <Logo height={65} priority className="clipupp-logo-l" imgClassName={LOGO_SIZE} />
          <Logo height={65} priority={false} variant="on-dark" className="clipupp-logo-d" imgClassName={LOGO_SIZE} />
        </div>

        <div className="[grid-area:search] min-w-0 pb-1.5 pt-1.5 lg:p-0">
          <HeaderSearch variant="pill" feed={feed.search} />
        </div>

        <nav aria-label={t("primaryNav")} className="flex items-center justify-end gap-0.5 [grid-area:actions] lg:gap-1">
          <CategoriesMenu
            categories={feed.categories}
            totalCoupons={feed.totalCoupons}
            calendarHref={anchorFor("calendar", feed.anchors) ?? "/offers"}
          />
          <Link
            href="/stores"
            className="hidden h-11 items-center rounded-full px-3 text-[15px] font-medium text-clipupp-neutral-800 hover:bg-clipupp-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary lg:inline-flex"
          >
            {t("stores")}
          </Link>
          <ThemeToggle />
          <SavedButton />
          {alertsHref && (
            <Link href={alertsHref} aria-label={t("alerts")} className={ICON_BTN}>
              <Bell className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          )}
          <Account />
        </nav>
      </div>
    </header>
  );
}

/** Row 1 collapses below lg: past 160px while scrolling down 6px+, back on 6px up or above 80px. */
function useCollapseOnScroll() {
  useEffect(() => {
    const html = document.documentElement;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (window.innerWidth >= 1024 || y < 80) {
        html.classList.remove("clipupp-hdr-c");
        last = y;
        return;
      }
      const d = y - last;
      if (d >= 6 && y > 160) html.classList.add("clipupp-hdr-c");
      else if (d <= -6) html.classList.remove("clipupp-hdr-c");
      if (Math.abs(d) >= 6) last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      html.classList.remove("clipupp-hdr-c");
    };
  }, []);
}

function SavedButton() {
  const t = useTranslations("header");
  const { count, hydrated } = useSavedCount();
  const open = useSavedSheet((s) => s.open);
  return (
    <button type="button" aria-label={t("saved")} onClick={open} className={ICON_BTN}>
      <Heart className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
      {hydrated && count > 0 ? (
        <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-clipupp-danger px-1 text-[11px] font-bold leading-none text-clipupp-danger-fg">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function Account() {
  const auth = useAuth();
  const t = useTranslations("header");
  if (auth.user) return <UserMenu />;
  return (
    <Link
      href="/sign-in"
      aria-label={t("signIn")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-clipupp-neutral-700 hover:bg-clipupp-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary shrink-0 whitespace-nowrap lg:ml-1 lg:h-10 lg:w-auto lg:border lg:border-clipupp-primary lg:px-5 lg:text-[15px] lg:font-medium lg:text-clipupp-primary lg:hover:bg-clipupp-primary-100"
    >
      <User className="h-5 w-5 lg:hidden" strokeWidth={1.8} aria-hidden="true" />
      <span className="hidden lg:inline">{t("signIn")}</span>
    </Link>
  );
}

function UserMenu() {
  const auth = useAuth();
  const t = useTranslations("header");
  const router = useRouter();
  if (!auth.user) return null;
  const { name, email, roles } = auth.user;
  const initial = (name || email)[0]?.toUpperCase() ?? "U";
  const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");

  async function handleLogout() {
    await auth.logout();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-clipupp-primary text-sm font-semibold text-clipupp-primary-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary focus-visible:ring-offset-2"
          aria-label={t("openAccountMenu")}
        >
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
