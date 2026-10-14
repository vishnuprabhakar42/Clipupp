"use client";

import { useEffect, useState } from "react";
import { Heart, Home, Store, Tag, Zap, type LucideIcon } from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { useSavedCount } from "@/lib/home/useSavedCoupons";
import { useSavedSheet } from "@/lib/home/useSavedSheet";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LazySavedSheet } from "@/components/site/lazy";
import { anchorFor, type HomeAnchor } from "@/lib/home/anchors";

type Key = "home" | "deals" | "coupons" | "stores";
type Labels = Record<Key | "saved", string>;

const SECTIONS: { id: HomeAnchor; key: Key }[] = [
  { id: "top", key: "home" },
  { id: "deals", key: "deals" },
  { id: "today", key: "coupons" },
  { id: "stores", key: "stores" },
];

const ROUTE_KEY: Record<string, Key> = { "/offers": "deals", "/coupons": "coupons", "/stores": "stores" };

const ITEM =
  "relative flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-clipupp-primary";

export function BottomNavClient({
  labels,
  ariaLabel,
  anchors,
}: {
  labels: Labels;
  ariaLabel: string;
  /** Homepage anchors that render; a missing block falls back to its route. */
  anchors: HomeAnchor[];
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrollKey, setScrollKey] = useState<Key>("home");
  const { count, hydrated } = useSavedCount();
  const openSaved = useSavedSheet((s) => s.open);
  const savedOpen = useSavedSheet((s) => s.isOpen);
  const { user } = useAuth();
  // The saved sheet loads on its first open (header heart or this nav). A
  // guest with saves mounts it early too: its closed-state lookup keeps the
  // badge counting only rows the sheet can show.
  const [savedMounted, setSavedMounted] = useState(false);
  if (!savedMounted && (savedOpen || (hydrated && !user && count > 0))) setSavedMounted(true);

  // Close the saved sheet on route changes. Lives here, not in the lazily
  // mounted sheet, whose mount would otherwise close it as it first opens.
  useEffect(() => {
    useSavedSheet.getState().close();
  }, [pathname]);

  // Only blocks with content are spied: a coming-soon tile is not where its nav item links.
  const spied = anchors.join(",");
  useEffect(() => {
    if (!isHome) return;
    const ids = new Set(spied.split(","));
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const hit = SECTIONS.find((s) => seen.get(s.id));
        if (hit) setScrollKey(hit.key);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const s of SECTIONS) {
      const el = ids.has(s.id) ? document.getElementById(s.id) : null;
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [isHome, spied]);

  const active: Key | "saved" | null = savedOpen ? "saved" : isHome ? scrollKey : (ROUTE_KEY[pathname] ?? null);

  const items: { key: Key; href: string; icon: LucideIcon }[] = [
    { key: "home", href: "/", icon: Home },
    { key: "deals", href: isHome ? (anchorFor("deals", anchors) ?? "/offers") : "/offers", icon: Zap },
    { key: "coupons", href: isHome ? (anchorFor("today", anchors) ?? "/coupons") : "/coupons", icon: Tag },
    { key: "stores", href: "/stores", icon: Store },
  ];
  const cls = (on: boolean) =>
    `${ITEM} ${on ? "text-clipupp-primary" : "text-clipupp-neutral-500"}`;

  return (
    <>
      <nav
        aria-label={ariaLabel}
        className="fixed inset-x-0 bottom-0 z-sticky border-t border-clipupp-neutral-200 bg-clipupp-surface lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-[640px] grid-cols-5">
          {items.map(({ key, href, icon: Icon }) => (
            <li key={key}>
              <Link href={href} aria-current={active === key ? "true" : undefined} className={cls(active === key)}>
                <Icon className="h-[22px] w-[22px]" strokeWidth={active === key ? 2.2 : 1.8} aria-hidden />
                <span>{labels[key]}</span>
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={openSaved} className={cls(active === "saved")}>
              <span className="relative">
                <Heart className="h-[22px] w-[22px]" strokeWidth={active === "saved" ? 2.2 : 1.8} aria-hidden />
                {hydrated && count > 0 ? (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-clipupp-danger px-1 text-[10px] font-bold leading-none text-clipupp-danger-fg">
                    {count}
                  </span>
                ) : null}
              </span>
              <span>{labels.saved}</span>
            </button>
          </li>
        </ul>
      </nav>
      {savedMounted ? <LazySavedSheet /> : null}
    </>
  );
}
