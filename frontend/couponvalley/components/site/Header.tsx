"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { LanguageToggle } from "@/components/language-toggle";
import { HeaderSearch } from "@/features/catalog/components/HeaderSearch";
import { AnnouncementBar } from "@/features/home/components/AnnouncementBar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { storesApi } from "@/lib/api/stores";
import { categoriesApi } from "@/lib/api/categories";

// ─── Category icon map ───────────────────────────────────────────────────
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
 * Collapse multi-word category names to a single word. Splits on `&`,
 * `/`, or " and ", then takes the first word of what remains.
 *
 *   "Food & Dining"          → "Food"
 *   "Books and Education"    → "Books"
 *   "Beauty / Personal Care" → "Beauty"
 *   "Automotive"             → "Automotive"
 */
function toSingleWord(label: string): string {
  if (!label) return "";
  const beforeJoiner = label.split(/\s*(?:&|\band\b|\/)\s*/i)[0]!.trim();
  return beforeJoiner.split(/\s+/)[0] ?? beforeJoiner;
}

// ─── Main Header ───────────────────────────────────────────────────────────
export function Header() {
  const auth = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  // Show/hide the chevron buttons based on whether more content exists in
  // either direction. Updated on scroll + on category-data load + on resize.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stores = useQuery({
    queryKey: ["nav", "stores"],
    queryFn: () => storesApi.list({ limit: 18 }),
    staleTime: 5 * 60_000,
  });

  const categories = useQuery({
    queryKey: ["nav", "categories"],
    queryFn: () => categoriesApi.tree(),
    staleTime: 10 * 60_000,
  });

  const topStores = stores.data?.data?.slice(0, 12) ?? [];
  const topCategories = categories.data?.slice(0, 12) ?? [];
  const stripCategories = categories.data ?? [];

  // Recompute which chevron arrows should be visible. Re-runs on scroll,
  // window resize, and whenever the category list changes width.
  useEffect(() => {
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
  }, [stripCategories.length]);

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
      {/* ── Row 0: Announcement bar (banner-driven) ── */}
      <AnnouncementBar />

      {/* ── Row 1: Main bar (compact) ── */}
      <div className="border-b">
        <div className="container flex h-12 items-center gap-2 md:h-14">
          {/* Mobile hamburger */}
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

          {/* Logo */}
          <Link
            href="/"
            aria-label="CouponValley home"
            className="flex shrink-0 items-center gap-2 font-bold text-cv-primary"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md bg-cv-primary text-white">
              <ShoppingBag className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden text-base font-bold tracking-tight sm:inline-block">CouponValley</span>
          </Link>

          {/* Categories dropdown — desktop */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-cv-neutral-700 transition-colors hover:bg-cv-neutral-100 hover:text-cv-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-primary">
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
                  {categories.isLoading &&
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="cv-skeleton h-9 rounded-md" />
                    ))}
                  {!categories.isLoading && topCategories.length === 0 && (
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
                    className="flex items-center justify-between px-3 py-2 text-sm font-medium text-cv-primary"
                  >
                    Browse all categories
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Pill search bar ── (constrained max-width so the header stays tight) */}
          <div className="mx-auto hidden w-full max-w-2xl md:block">
            <HeaderSearch variant="pill" />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-0.5">
            {/* Mobile search */}
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

            {/* Language toggle (desktop only, compact) */}
            <span className="hidden lg:inline-flex">
              <LanguageToggle />
            </span>

            {/* Saved (icon-only on small/medium, with text on lg+) */}
            <Link
              href="/account/saved-coupons"
              className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-cv-neutral-700 transition-colors hover:bg-cv-neutral-100 hover:text-cv-neutral-900 sm:inline-flex"
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

        {/* Mobile search panel */}
        {mobileSearchOpen && (
          <div className="border-t bg-background px-4 py-3 md:hidden">
            <HeaderSearch variant="pill" />
          </div>
        )}
      </div>
      {/* End of sticky boundary — only the announcement bar + main nav stay
          pinned. The category strip below is intentionally NOT sticky so it
          scrolls away with the content, giving readers more vertical space
          on deep scrolls. */}
      </header>

      {/* ── Row 2: Category icon strip (desktop only, scrolls with page) ── */}
      <div className="hidden border-b bg-background lg:block">
        <div className="container relative px-2">
          <div
            ref={stripRef}
            className="cv-no-scrollbar flex items-start overflow-x-auto py-1.5 pr-12"
          >
            {/* Pinned shortcuts — keep their two-word labels (design exception) */}
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

            {/* Dynamic categories — one-word labels for visual rhythm. */}
            {categories.isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex shrink-0 flex-col items-center gap-2 px-3 py-1"
                  >
                    <div className="cv-skeleton h-11 w-11 rounded-full" />
                    <div className="cv-skeleton h-2.5 w-14 rounded" />
                  </div>
                ))
              : stripCategories.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    label={toSingleWord(cat.title)}
                    icon={getCatIcon(cat.slug, cat.title)}
                    tone="primary"
                  />
                ))}
          </div>

          {/* Left chevron — visible only when the strip is scrolled right */}
          {canScrollLeft && (
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollStrip("left")}
              className="absolute left-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-cv-neutral-200 bg-white text-cv-neutral-600 shadow-card transition-colors hover:text-cv-neutral-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Right chevron — visible only when more content is off-screen */}
          {canScrollRight && (
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollStrip("right")}
              className="absolute right-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-cv-neutral-200 bg-white text-cv-neutral-600 shadow-card transition-colors hover:text-cv-neutral-900"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Category chip ─────────────────────────────────────────────────────────
/**
 * CategoryChip — fixed-size icon tile + uppercase tag label below.
 *   • 44px circular icon container (WCAG tap target)
 *   • 20px icon
 *   • 11px uppercase 0.04em label, single line, max-width caps long words
 * `tone` controls the brand role: primary (default), accent (hot/urgent),
 * success (verified/coupons). No decorative motion on hover — colour shift
 * only.
 */
type ChipTone = "primary" | "accent" | "success";
const TONE_STYLES: Record<ChipTone, { bg: string; icon: string }> = {
  primary: { bg: "bg-cv-primary-soft", icon: "text-cv-primary" },
  accent: { bg: "bg-cv-accent-soft", icon: "text-cv-accent" },
  success: { bg: "bg-cv-success-soft", icon: "text-cv-success-strong" },
};

function CategoryChip({
  href,
  label,
  icon: Icon,
  tone = "primary",
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  tone?: ChipTone;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <Link
      href={href}
      className="group flex w-[88px] shrink-0 flex-col items-center gap-2 rounded-lg px-2 py-2 text-center transition-colors hover:bg-cv-neutral-100"
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${styles.bg}`}
      >
        <Icon className={`h-5 w-5 ${styles.icon}`} aria-hidden strokeWidth={1.75} />
      </span>
      <span className="line-clamp-1 max-w-full text-[11px] font-semibold uppercase tracking-[0.04em] text-cv-neutral-700 group-hover:text-cv-neutral-900">
        {label}
      </span>
    </Link>
  );
}

// ─── User menu ─────────────────────────────────────────────────────────────
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
          className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-cv-primary text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-primary focus-visible:ring-offset-2"
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

// ─── Mobile menu ───────────────────────────────────────────────────────────
function MobileMenu({
  stores,
  categories,
}: {
  stores: Array<{ id: string; slug: string; name: string; logoUrl: string }>;
  categories: Array<{ id: string; slug: string; title: string }>;
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
      <div className="flex items-center gap-3 border-b border-cv-neutral-200 px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-cv-primary text-white">
          <ShoppingBag className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-base font-semibold">CouponValley</span>
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

      <div className="border-t p-4">
        {user ? (
          <div className="space-y-1">
            <Link
              href="/account"
              className="flex items-center gap-3 rounded-md p-2 transition hover:bg-accent"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cv-primary text-sm font-semibold text-white">
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

// ─── Mobile nav link ───────────────────────────────────────────────────────
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
        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-cv-neutral-100"
      >
        {children}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}
