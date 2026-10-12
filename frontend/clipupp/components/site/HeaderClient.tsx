"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, LayoutGrid, LogOut, Menu } from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { Logo } from "@/components/site/Logo";
import { HeaderSearch } from "@/features/catalog/components/HeaderSearch";
import { useAuth } from "@/lib/auth/AuthProvider";

export type NavStore = { id: string; slug: string; name: string; logoUrl: string };
export type NavCategory = { id: string; slug: string; title: string };

/**
 * Site header (spec block 0). 64px, white, 1px bottom border. The search is
 * a field on every breakpoint: on desktop it sits centre, on mobile it drops
 * to a second row under the wordmark so it never collapses to an icon.
 * Right side: Stores, Categories (dropdown), Saved, then Sign in or the
 * account menu. The locale switcher lives in the mobile drawer only.
 */
export function HeaderClient({ stores, categories }: { stores: NavStore[]; categories: NavCategory[] }) {
  const auth = useAuth();
  const t = useTranslations("header");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const topCategories = categories.slice(0, 12);
  const navLink =
    "inline-flex h-10 items-center gap-1 rounded-md px-2.5 text-[15px] font-medium text-clipupp-neutral-900 transition-colors hover:text-clipupp-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary";

  return (
    <header
      role="banner"
      className={
        "sticky top-0 z-sticky w-full border-b border-clipupp-neutral-200 bg-white transition-shadow " +
        (scrolled ? "shadow-card" : "")
      }
    >
      <div className="clipupp-container flex h-16 items-center gap-4 lg:gap-7">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label={t("openMenu")}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0">
            <MobileMenu stores={stores.slice(0, 8)} categories={topCategories} />
          </SheetContent>
        </Sheet>

        <Logo height={32} priority />

        <div className="hidden min-w-0 flex-1 md:block">
          <HeaderSearch variant="pill" />
        </div>

        <nav aria-label={t("primaryNav")} className="ml-auto hidden items-center gap-1 lg:flex">
          <Link href="/stores" className={navLink}>{t("stores")}</Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={navLink}>
                <LayoutGrid className="h-4 w-4" aria-hidden />
                {t("categories")}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[min(520px,calc(100vw-2rem))] p-3" align="end">
              <div className="grid grid-cols-2 gap-1">
                {topCategories.map((c) => (
                  <DropdownMenuItem asChild key={c.id} className="rounded-md">
                    <Link href={`/categories/${c.slug}`} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <span className="line-clamp-1">{c.title}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-md">
                <Link href="/categories" className="flex items-center justify-between px-3 py-2 text-sm font-medium text-clipupp-primary">
                  {t("browseAllCategories")}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/account/saved-coupons" className={navLink}>{t("saved")}</Link>
          {auth.user ? (
            <UserMenu />
          ) : (
            <Link
              href="/sign-in"
              className="ml-1 inline-flex h-10 items-center rounded-full border border-clipupp-primary px-5 text-[15px] font-medium text-clipupp-primary transition-colors hover:bg-clipupp-tint-100"
            >
              {t("signIn")}
            </Link>
          )}
        </nav>

        <div className="ml-auto lg:hidden">
          {auth.user ? (
            <UserMenu />
          ) : (
            <Link href="/sign-in" className="inline-flex h-10 items-center rounded-full border border-clipupp-primary px-4 text-[14px] font-medium text-clipupp-primary">
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>

      <div className="clipupp-container pb-3 md:hidden">
        <HeaderSearch variant="pill" />
      </div>
    </header>
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
          className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-clipupp-primary text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary focus-visible:ring-offset-2"
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

function MobileMenu({ stores, categories }: { stores: NavStore[]; categories: NavCategory[] }) {
  const auth = useAuth();
  const t = useTranslations("header");
  const router = useRouter();
  const user = auth.user;

  async function handleLogout() {
    await auth.logout();
    router.push("/");
    router.refresh();
  }

  const item = "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-clipupp-neutral-100";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-clipupp-neutral-200 px-5 py-4">
        <Logo height={28} />
      </div>
      <nav className="flex-1 overflow-y-auto p-4 text-sm" aria-label={t("mobileNav")}>
        <ul className="space-y-1">
          <li><Link href="/coupons" className={item}>{t("allCoupons")} <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /></Link></li>
          <li><Link href="/stores" className={item}>{t("stores")} <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /></Link></li>
          <li><Link href="/categories" className={item}>{t("categories")} <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /></Link></li>
          <li><Link href="/account/saved-coupons" className={item}>{t("saved")} <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /></Link></li>
          <li><Link href="/blog" className={item}>{t("blog")} <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /></Link></li>
        </ul>
        {stores.length > 0 && (
          <>
            <p className="mb-2 mt-5 px-3 text-[11px] font-medium uppercase tracking-[0.04em] text-clipupp-neutral-500">{t("topStores")}</p>
            <ul className="grid grid-cols-2 gap-1">
              {stores.map((s) => (
                <li key={s.id}>
                  <Link href={`/stores/${s.slug}`} className="flex items-center gap-2 rounded-md p-2 hover:bg-clipupp-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logoUrl} alt="" className="h-7 w-7 rounded object-contain" loading="lazy" />
                    <span className="line-clamp-1 text-xs">{s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        {categories.length > 0 && (
          <>
            <p className="mb-2 mt-5 px-3 text-[11px] font-medium uppercase tracking-[0.04em] text-clipupp-neutral-500">{t("categories")}</p>
            <ul className="space-y-1">
              {categories.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.slug}`} className="block rounded-md px-3 py-2 text-sm hover:bg-clipupp-neutral-100">{c.title}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
      <div className="space-y-3 border-t p-4">
        <div className="flex items-center justify-between rounded-md border border-clipupp-neutral-200 p-2">
          <span className="px-2 text-xs font-medium uppercase tracking-[0.04em] text-clipupp-neutral-500">{t("language")}</span>
          <LocaleSwitcher variant="pill" align="end" />
        </div>
        {user ? (
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4" aria-hidden /> {t("signOut")}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild variant="primary"><Link href="/sign-up">{t("createAccount")}</Link></Button>
            <Button asChild variant="secondary"><Link href="/sign-in">{t("signIn")}</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
