"use client";

import { LayoutGrid } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/** Grid shell: below lg it shows the first tiles plus an "All stores" tile that reveals the rest. */
export function AllStoresExpander({ total, hasMore, children }: { total: number; hasMore: boolean; children: ReactNode }) {
  const t = useTranslations("home.stores");
  const [open, setOpen] = useState(false);
  return (
    <ul
      id="stores-grid"
      data-open={open ? "" : undefined}
      className="clipupp-stores grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:gap-3.5"
    >
      {children}
      {hasMore && !open && (
        <li className="flex lg:hidden">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="stores-grid"
            onClick={() => setOpen(true)}
            className="flex w-full min-w-0 flex-col items-center gap-1 rounded-2xl border border-clipupp-primary-200 bg-clipupp-tint-100 px-1.5 py-3 text-center"
          >
            <span className="grid h-[46px] w-[46px] place-items-center rounded-xl bg-clipupp-surface text-clipupp-primary">
              <LayoutGrid size={22} aria-hidden />
            </span>
            <b className="mt-1 w-full truncate text-[12.5px] font-semibold text-clipupp-primary">{t("all")}</b>
            <span className="text-[11.5px] text-clipupp-neutral-500">{t("listed", { count: total })}</span>
          </button>
        </li>
      )}
    </ul>
  );
}
