"use client";

import { useEffect, useRef, useState } from "react";
import {
  Baby,
  Bookmark,
  BookOpen,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Dumbbell,
  Film,
  Flame,
  Footprints,
  Gamepad2,
  Gem,
  Gift,
  Heart,
  Home,
  Laptop,
  Leaf,
  LogIn,
  LogOut,
  LayoutGrid,
  Menu,
  Music,
  PawPrint,
  Percent,
  Plane,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  UtensilsCrossed,
  Watch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useRouter, usePathname } from "@/lib/i18n/navigation";
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
import { HeaderSearch } from "@/features/catalog/components/HeaderSearch";
import { useAuth } from "@/lib/auth/AuthProvider";

export type NavStore = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
};

export type NavCategory = {
  id: string;
  slug: string;
  title: string;
};

// Every category maps to one meaningful Lucide icon. Backgrounds + text
// colours are uniform brand-primary across the strip so the rail reads
// consistently. The first matching keyword wins; more-specific entries
// (e.g. "grocer" before "food") come first.
const CAT_ICON_MAP: Array<{ match: string[]; icon: LucideIcon }> = [
  { match: ["grocer", "supermarket"], icon: ShoppingCart },
  { match: ["pet", "animal"], icon: PawPrint },
  { match: ["jewel", "gem", "ring"], icon: Gem },
  { match: ["electron", "tech", "gadget", "computer", "mobile", "phone"], icon: Laptop },
  { match: ["fashion", "cloth", "apparel", "wear", "dress"], icon: Shirt },
  { match: ["food", "dining", "restaurant", "eat", "snack"], icon: UtensilsCrossed },
  { match: ["travel", "flight", "hotel", "vacation", "holiday"], icon: Plane },
  { match: ["beauty", "cosmetic", "skincare", "makeup", "hair"], icon: Sparkles },
  { match: ["home", "furniture", "decor", "kitchen", "appliance"], icon: Home },
  { match: ["sport", "fitness", "gym", "outdoor", "exercise", "yoga"], icon: Dumbbell },
  { match: ["book", "education", "learning", "course", "study"], icon: BookOpen },
  { match: ["health", "wellness", "pharmacy", "medical", "medicine"], icon: Heart },
  { match: ["gift", "present", "occasion"], icon: Gift },
  { match: ["bank", "finance", "financial", "insurance", "money", "invest", "credit"], icon: DollarSign },
  { match: ["game", "gaming", "toy", "play"], icon: Gamepad2 },
  { match: ["shoe", "footwear", "boot", "sandal"], icon: Footprints },
  { match: ["accessory", "accessories", "watch", "bag", "purse"], icon: Watch },
  { match: ["baby", "kid", "children", "toddler", "infant"], icon: Baby },
  { match: ["garden", "plant", "flower", "lawn"], icon: Leaf },
  { match: ["auto", "car", "vehicle", "motor", "bike"], icon: Car },
  { match: ["movie", "film", "cinema", "entertain", "stream"], icon: Film },
  { match: ["music", "audio", "concert", "headphone"], icon: Music },
  { match: ["coupon", "percent", "discount", "saving", "deal"], icon: Percent },
];

function getCatIcon(slug: string, title: string): LucideIcon {
  const text = `${slug} ${title}`.toLowerCase();
  for (const entry of CAT_ICON_MAP) {
    if (entry.match.some((m) => text.includes(m))) return entry.icon;
  }
  return Tag;
}

/**
 * Collapse multi-word category names to a single word.
 *   "Food & Dining"          -> "Food"
 *   "Books and Education"    -> "Books"
 *   "Beauty / Personal Care" -> "Beauty"
 *   "Automotive"             -> "Automotive"
 */
function toSingleWord(label: string): string {
  if (!label) return "";
  const beforeJoiner = label.split(/\s*(?:&|\band\b|\/)\s*/i)[0]!.trim();
  return beforeJoiner.split(/\s+/)[0] ?? beforeJoiner;
}

/**
 * HeaderClient — the interactive shell of the site header. Receives nav data
 * already fetched server-side (via the Header server wrapper) so this
 * component does NOT pull React Query. Owns: scroll-shadow, mobile drawer,
 * mobile search toggle, categories dropdown, category-strip scroll arrows,
 * user menu.
 */
export function HeaderClient({
  stores,
  categories,
}: {
  stores: NavStore[];
  categories: NavCategory[];
}) {
  const auth = useAuth();
  const pathname = usePathname();
  // The category icon strip is homepage chrome — it's a wayfinding shortcut
  // for first-time visitors landing on /, not a global nav element. On every
  // other page it's just noise that competes with the page's own headings
  // (store hero, category hero, coupon hero, etc.).
  // next-intl's usePathname strips the [locale] segment, so home is just "/".
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const topStores = stores.slice(0, 12);
  const topCategories = categories.slice(0, 12);
  const stripCategories = categories;

  useEffect(() => {
    // Effect re-attaches when the strip mounts/unmounts (navigating into/out
    // of the homepage), so `isHome` belongs in the deps even though it
    // doesn't appear in the body.
    if (!isHome) return;
    const el = stripRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft < max - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [stripCategories.length, isHome]);

  function scrollStrip(dir: "left" | "right") {
    stripRef.current?.scrollBy({ left: dir === "right" ? 260 : -260, behavior: "smooth" });
  }

  return (
    <>
    <header
      className={
        "sticky top-0 z-sticky w-full bg-background transition-shadow " +
        (scrolled ? "shadow-card" : "")
      }
      role="banner"
    >
      <div className="border-b">
        <div className="container flex h-12 items-center gap-2 md:h-14">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0">
              <MobileMenu stores={topStores} categories={topCategories} />
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            aria-label="Clipupp home"
            className="flex shrink-0 items-center gap-2 text-clipupp-primary-700"
          >
            <svg
              viewBox="0 0 32 32"
              width={32}
              height={32}
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M11 6 L11 22 A4.5 4.5 0 0 0 20 22 L20 10 A3.5 3.5 0 0 0 13 10 L13 19"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="clipupp-text-gradient-hero font-display text-[1.25rem] font-extrabold tracking-tight">
              clipupp
            </span>
          </Link>

          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-clipupp-neutral-700 transition-colors hover:bg-clipupp-neutral-100 hover:text-clipupp-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary">
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  Categories
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[min(520px,calc(100vw-2rem))] p-3"
                align="start"
              >
                <div className="grid grid-cols-2 gap-1">
                  {topCategories.length === 0 && (
                    <p className="col-span-2 px-3 py-3 text-sm text-muted-foreground">
                      No categories yet.
                    </p>
                  )}
                  {topCategories.map((c) => (
                    <DropdownMenuItem asChild key={c.id} className="rounded-md">
                      <Link
                        href={`/categories/${c.slug}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm"
                      >
                        <span className="line-clamp-1">{c.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-md">
                  <Link
                    href="/categories"
                    className="flex items-center justify-between px-3 py-2 text-sm font-medium text-clipupp-primary"
                  >
                    Browse all categories
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mx-auto hidden w-full max-w-2xl md:block">
            <HeaderSearch variant="pill" />
          </div>

          <div className="ml-auto flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Search"
              aria-expanded={mobileSearchOpen}
              onClick={() => setMobileSearchOpen((s) => !s)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <span className="hidden lg:inline-flex">
              <LocaleSwitcher variant="pill" />
            </span>

            <Link
              href="/account/saved-coupons"
              className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-clipupp-neutral-700 transition-colors hover:bg-clipupp-neutral-100 hover:text-clipupp-neutral-900 sm:inline-flex"
              aria-label="Saved coupons"
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              <span className="hidden lg:inline">Saved</span>
            </Link>

            {auth.user ? (
              <UserMenu />
            ) : (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/sign-in">
                    <LogIn className="mr-1.5 h-4 w-4" aria-hidden />
                    Sign in
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="primary"
                  className="hidden px-4 sm:inline-flex"
                >
                  <Link href="/sign-up">Get started</Link>
                </Button>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="sm:hidden"
                  aria-label="Sign in"
                >
                  <Link href="/sign-in">
                    <LogIn className="h-5 w-5" aria-hidden />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="border-t bg-background px-4 py-3 md:hidden">
            <HeaderSearch variant="pill" />
          </div>
        )}
      </div>
    </header>

    {/* Category icon strip — homepage-only wayfinding for first-time visitors.
        On detail pages (store, coupon, category) the page's own hero header
        already orients the user, so this strip would just duplicate intent
        and steal vertical space. Hidden on every route except "/". */}
    {isHome && (
      <div className="hidden border-b bg-background lg:block">
        <div className="container relative px-2">
          <div
            ref={stripRef}
            className="clipupp-no-scrollbar flex items-start overflow-x-auto py-1.5 pr-12"
          >
            <CategoryChip
              href="/offers"
              label="Hot Deals"
              icon={Flame}
              tone="accent"
            />
            <CategoryChip
              href="/coupons"
              label="Coupons"
              icon={Percent}
              tone="success"
            />

            {stripCategories.map((cat) => (
              <CategoryChip
                key={cat.id}
                href={`/categories/${cat.slug}`}
                label={toSingleWord(cat.title)}
                icon={getCatIcon(cat.slug, cat.title)}
                tone="primary"
              />
            ))}
          </div>

          {canScrollLeft && (
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollStrip("left")}
              className="absolute left-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-clipupp-neutral-200 bg-white text-clipupp-neutral-600 shadow-card transition-colors hover:text-clipupp-neutral-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollStrip("right")}
              className="absolute right-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-clipupp-neutral-200 bg-white text-clipupp-neutral-600 shadow-card transition-colors hover:text-clipupp-neutral-900"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    )}
    </>
  );
}

function CategoryChip({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Deprecated — tone is ignored in the clean palette. All chips share
   *  the same single soft-primary tile + primary icon treatment. */
  tone?: "primary" | "accent" | "success";
}) {
  return (
    <Link
      href={href}
      className="group flex w-[88px] shrink-0 flex-col items-center gap-2 rounded-lg px-2 py-2 text-center transition-colors hover:bg-clipupp-neutral-100"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-clipupp-primary-soft transition-colors">
        <Icon className="h-5 w-5 text-clipupp-primary" aria-hidden strokeWidth={2} />
      </span>
      <span className="line-clamp-1 max-w-full text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-neutral-700 group-hover:text-clipupp-neutral-900">
        {label}
      </span>
    </Link>
  );
}

function UserMenu() {
  const auth = useAuth();
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
          aria-label="Open account menu"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {name && <span className="truncate text-sm font-medium">{name}</span>}
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">Overview</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/saved-coupons">Saved coupons</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/click-history">Click history</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/preferences">Preferences</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">Admin dashboard</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu({
  stores,
  categories,
}: {
  stores: NavStore[];
  categories: NavCategory[];
}) {
  const auth = useAuth();
  const router = useRouter();
  const user = auth.user;

  async function handleLogout() {
    await auth.logout();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-clipupp-neutral-200 px-5 py-4 text-clipupp-primary-700">
        <svg viewBox="0 0 32 32" width={28} height={28} aria-hidden>
          <path
            d="M11 6 L11 22 A4.5 4.5 0 0 0 20 22 L20 10 A3.5 3.5 0 0 0 13 10 L13 19"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="clipupp-text-gradient-hero font-display text-lg font-extrabold tracking-tight">
          clipupp
        </span>
      </div>

      <nav
        className="flex-1 overflow-y-auto p-4 text-sm"
        aria-label="Mobile navigation"
      >
        <ul className="space-y-1">
          <MobileNavLink href="/coupons">All coupons</MobileNavLink>
          <MobileNavLink href="/offers">Hot deals</MobileNavLink>
          <MobileNavLink href="/stores">Browse stores</MobileNavLink>
          <MobileNavLink href="/categories">Browse categories</MobileNavLink>
          <MobileNavLink href="/blog">Blog</MobileNavLink>
        </ul>

        {stores.length > 0 && (
          <>
            <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Top stores
            </p>
            <ul className="grid grid-cols-2 gap-1">
              {stores.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/stores/${s.slug}`}
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-accent"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.logoUrl}
                        alt=""
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </span>
                    <span className="line-clamp-1 text-xs">{s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {categories.length > 0 && (
          <>
            <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Top categories
            </p>
            <ul className="space-y-1">
              {categories.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categories/${c.slug}`}
                    className="block rounded-md px-3 py-2 text-sm transition hover:bg-accent"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="space-y-3 border-t p-4">
        {/* Locale switcher first — both signed-in and signed-out users need
            an accessible way to flip between en/hi from the mobile drawer. */}
        <div className="flex items-center justify-between rounded-md border border-clipupp-neutral-200 p-2">
          <span className="px-2 text-xs font-semibold uppercase tracking-[0.04em] text-clipupp-neutral-500">
            Language
          </span>
          <LocaleSwitcher variant="pill" align="end" />
        </div>

        {user ? (
          <div className="space-y-1">
            <Link
              href="/account"
              className="flex items-center gap-3 rounded-md p-2 transition hover:bg-accent"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-clipupp-primary text-sm font-semibold text-white">
                {(user.name || user.email)[0]?.toUpperCase()}
              </span>
              <span className="min-w-0 text-sm">
                <span className="block truncate font-medium">
                  {user.name || "Account"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild variant="primary">
              <Link href="/sign-up">Create account</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MobileNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-clipupp-neutral-100"
      >
        {children}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}
