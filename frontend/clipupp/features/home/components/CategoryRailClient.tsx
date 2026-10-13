"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { CategoryGlyph } from "@/components/site/CategoryGlyph";
import { shortCategoryLabel } from "@/lib/home/categoryLabel";
import { emit, on, peek } from "@/lib/home/homeBus";
import { cn } from "@/lib/utils";

type Cat = { id: string; name: string; icon: string; hot?: boolean };

/** Chips are buttons on the homepage (emit "today:tab" and scroll) and plain links elsewhere. */
export function CategoryRailClient({
  categories,
  ariaLabel,
  calendarOnPage,
}: {
  categories: Cat[];
  ariaLabel: string;
  /** False when the sale calendar block does not render: the festive chip then links to /offers. */
  calendarOnPage: boolean;
}) {
  const isHome = usePathname() === "/";
  const firstCat = categories.find((c) => !c.hot)?.id ?? "";
  // Phone shows no pressed chip until a tab is chosen; lg+ defaults to the first category.
  const [pressed, setPressed] = useState("");

  useEffect(() => {
    const last = peek("today:tab");
    if (last) setPressed(last);
    else if (window.matchMedia("(min-width: 1024px)").matches) setPressed(firstCat);
    return on("today:tab", setPressed);
  }, [firstCat]);

  function choose(c: Cat) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    if (c.hot) {
      document.getElementById("calendar")?.scrollIntoView({ behavior });
      return;
    }
    setPressed(c.id);
    emit("today:tab", c.id);
    document.getElementById("today")?.scrollIntoView({ behavior });
  }

  return (
    <nav aria-label={ariaLabel} className="border-b border-clipupp-neutral-200 bg-clipupp-surface">
      <div className="clipupp-container">
        <ul className="clipupp-no-scrollbar -mx-1 flex gap-0 overflow-x-auto px-1 py-3 lg:justify-between">
          {categories.map((c) => {
            const on = isHome && !c.hot && pressed === c.id;
            const inner = (
              <>
                <span
                  className={cn(
                    "grid h-[50px] w-[50px] place-items-center rounded-2xl transition-colors",
                    c.hot
                      ? "bg-clipupp-deep text-clipupp-gold"
                      : on
                        ? "bg-clipupp-primary text-clipupp-primary-fg"
                        : "bg-clipupp-primary-100 text-clipupp-primary",
                  )}
                >
                  <CategoryGlyph name={c.icon} hot={c.hot} className="h-[22px] w-[22px]" />
                </span>
                <span
                  className={cn(
                    "max-w-full truncate whitespace-nowrap text-center text-xs lg:text-[13px]",
                    on ? "font-semibold text-clipupp-primary" : "font-medium text-clipupp-neutral-700",
                  )}
                >
                  {shortCategoryLabel(c.name)}
                </span>
              </>
            );
            const cls =
              "flex w-[72px] flex-col items-center gap-1.5 rounded-xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary lg:w-[78px]";
            return (
              <li key={c.id} className="shrink-0">
                {isHome && (calendarOnPage || !c.hot) ? (
                  <button type="button" title={c.name} aria-label={c.name} aria-pressed={c.hot ? undefined : on} onClick={() => choose(c)} className={cls}>
                    {inner}
                  </button>
                ) : (
                  <Link href={c.hot ? (calendarOnPage ? "/#calendar" : "/offers") : `/categories/${c.id}`} title={c.name} aria-label={c.name} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
