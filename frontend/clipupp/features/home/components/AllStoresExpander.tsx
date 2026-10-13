"use client";

import { LayoutGrid } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Grid shell: shows the first tiles (7 below lg, 12 at lg) plus an "All stores"
 * tile that reveals the rest. `data-all` says at which widths the tile can show.
 */
export function AllStoresExpander({
  total,
  compact,
  desktop,
  children,
}: {
  total: number;
  compact: number;
  desktop: number;
  children: ReactNode;
}) {
  const t = useTranslations("home.stores");
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  // The tile unmounts on expand; hand focus to the first store it revealed.
  useEffect(() => {
    if (!open) return;
    const sel = window.matchMedia("(min-width: 1024px)").matches ? 'li[data-tier="x"] a' : "li[data-tier] a";
    list.current?.querySelector<HTMLAnchorElement>(sel)?.focus({ preventScroll: true });
  }, [open]);
  return (
    <ul
      ref={list}
      id="stores-grid"
      data-open={open ? "" : undefined}
      className="clipupp-stores grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:gap-3.5"
    >
      {children}
      {total > compact && !open && (
        <li className="flex" data-all={total > desktop ? undefined : "base"}>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="stores-grid"
            onClick={() => setOpen(true)}
            className="flex w-full min-w-0 flex-col items-center gap-1 rounded-[14px] border border-clipupp-tint-200 bg-clipupp-tint-100 px-1.5 py-3 text-center lg:items-start lg:gap-1.5 lg:p-4 lg:text-left"
          >
            <span className="grid h-[46px] w-[46px] place-items-center rounded-xl bg-clipupp-surface text-clipupp-primary">
              <LayoutGrid size={22} aria-hidden />
            </span>
            <b className="mt-1 w-full truncate text-[12.5px] font-semibold text-clipupp-primary lg:mt-0 lg:text-[16px]">{t("all")}</b>
            <span className="text-[11.5px] text-clipupp-neutral-600 lg:text-[14px]">{t("listed", { count: total })}</span>
          </button>
        </li>
      )}
    </ul>
  );
}
