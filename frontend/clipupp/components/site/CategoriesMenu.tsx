"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { LazyCategoriesMenuPanel } from "@/components/site/lazy";
import { LazyBoundary } from "@/components/site/LazyBoundary";
import { cn } from "@/lib/utils";

export type MenuCategory = {
  id: string;
  name: string;
  icon: string;
  hot?: boolean;
  couponCount: number;
  topStores: { slug: string; name: string }[];
};

const LG = "(min-width: 1024px)";

/**
 * Categories trigger. Its panel (`CategoriesMenuPanel`, loaded on the first
 * open) is a full-width region under the header at lg+ and the same grid in
 * a bottom Sheet below lg. Single trigger element, so it works in both header
 * layouts.
 */
export function CategoriesMenu({
  categories,
  totalCoupons,
  calendarHref,
}: {
  categories: MenuCategory[];
  totalCoupons: number;
  /** Where the festive (hot) category goes: the calendar block when it renders, else its route. */
  calendarHref: string;
}) {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  // The panel (mega grid and sheet) loads on the first open and stays mounted.
  const [mounted, setMounted] = useState(false);
  if (open && !mounted) setMounted(true);
  const [desktop, setDesktop] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    const mq = window.matchMedia(LG);
    const sync = () => {
      setDesktop(mq.matches);
      setOpen(false); // crossing the breakpoint closes whichever form was open
    };
    setDesktop(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open || !desktop) return;
    const onDown = (e: Event) => {
      const el = e.target as Node;
      if (panelRef.current?.contains(el) || triggerRef.current?.contains(el)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("touchstart", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("touchstart", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, desktop]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("categories")}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full text-[15px] font-medium text-clipupp-neutral-800 transition-colors hover:bg-clipupp-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary lg:px-3",
          open && "bg-clipupp-neutral-100",
        )}
      >
        <LayoutGrid className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        <span className="hidden lg:inline">{t("categories")}</span>
        <ChevronDown
          className={cn("hidden h-4 w-4 transition-transform lg:block", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {mounted ? (
        <LazyBoundary name="CategoriesMenuPanel">
          <LazyCategoriesMenuPanel
            open={open}
            desktop={desktop}
            onClose={close}
            panelRef={panelRef}
            panelId={panelId}
            titleId={titleId}
            categories={categories}
            totalCoupons={totalCoupons}
            calendarHref={calendarHref}
          />
        </LazyBoundary>
      ) : null}
    </>
  );
}
