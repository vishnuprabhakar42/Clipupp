"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Sheet, SheetHeader } from "@/components/site/Sheet";
import { CategoryGlyph } from "@/components/site/CategoryGlyph";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
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
 * Categories trigger plus its panel. lg+: full-width panel under the header.
 * Below lg: the same grid inside a bottom Sheet. Single trigger element, so
 * it works in both header layouts.
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
  const tc = useTranslations("categories");
  const [open, setOpen] = useState(false);
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

  const grid = <CategoryGrid categories={categories} calendarHref={calendarHref} onSelect={close} />;

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

      {desktop && open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label={t("categories")}
          className="clipupp-mega-in absolute inset-x-0 top-full border-b border-clipupp-neutral-200 bg-clipupp-surface shadow-clipupp-pop"
        >
          <div className="clipupp-container py-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-clipupp-neutral-500">
                {t("shopByCategory")}
              </p>
              <div className="flex items-center gap-3">
                <LocaleSwitcher variant="pill" align="end" />
                <Link
                  href="/coupons"
                  onClick={close}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-clipupp-primary hover:underline"
                >
                  {t("allCoupons")}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            {grid}
          </div>
        </div>
      ) : null}

      {!desktop ? (
        <Sheet open={open} onClose={close} labelledBy={titleId} size="sheet">
          <div id={panelId}>
            <SheetHeader
              titleId={titleId}
              title={tc("sheetTitle")}
              subtitle={tc("verifiedCount", { count: totalCoupons })}
              onClose={close}
            />
            <div className="p-4 pb-2">{grid}</div>
            <div className="flex items-center justify-between gap-3 border-t border-clipupp-neutral-200 p-4">
              <Link
                href="/coupons"
                onClick={close}
                className="inline-flex items-center gap-1 text-sm font-semibold text-clipupp-primary"
              >
                {t("allCoupons")}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <LocaleSwitcher variant="pill" align="end" />
            </div>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}

function CategoryGrid({
  categories,
  calendarHref,
  onSelect,
}: {
  categories: MenuCategory[];
  calendarHref: string;
  onSelect: () => void;
}) {
  const t = useTranslations("header");
  const tc = useTranslations("categories");
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => {
        const sub = c.hot
          ? tc("festiveSub")
          : c.topStores.length
            ? c.topStores.map((s) => s.name).join(", ")
            : t("couponCount", { count: c.couponCount });
        return (
          <li key={c.id}>
            <Link
              href={c.hot ? calendarHref : `/categories/${c.id}`}
              onClick={onSelect}
              className="flex h-full items-center gap-3 rounded-2xl border border-clipupp-neutral-200 bg-clipupp-surface p-2.5 text-left transition-colors hover:border-clipupp-primary-300 hover:bg-clipupp-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary"
            >
              <span
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                  c.hot ? "bg-clipupp-deep text-clipupp-gold" : "bg-clipupp-primary-100 text-clipupp-primary",
                )}
              >
                <CategoryGlyph name={c.icon} hot={c.hot} className="h-[22px] w-[22px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-clipupp-neutral-900">{c.name}</span>
                <span className="block truncate text-xs text-clipupp-neutral-500">{sub}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
