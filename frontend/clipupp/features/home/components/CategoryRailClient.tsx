"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { CategoryGlyph } from "@/components/site/CategoryGlyph";
import { emit, on, peek } from "@/lib/home/homeBus";
import { cn } from "@/lib/utils";

type Cat = { id: string; name: string; icon: string; hot?: boolean };

/** Chips are buttons on the homepage (emit "today:tab" and scroll) and plain links elsewhere. */
export function CategoryRailClient({ categories, ariaLabel }: { categories: Cat[]; ariaLabel: string }) {
  const isHome = usePathname() === "/";
  const firstCat = categories.find((c) => !c.hot)?.id ?? "";
  const [pressed, setPressed] = useState(firstCat);

  useEffect(() => {
    const last = peek("today:tab");
    if (last) setPressed(last);
    return on("today:tab", setPressed);
  }, []);

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
                    "text-center text-xs leading-tight lg:text-[13px]",
                    on ? "font-semibold text-clipupp-primary" : "font-medium text-clipupp-neutral-700",
                  )}
                >
                  {c.name}
                </span>
              </>
            );
            const cls =
              "flex w-[72px] flex-col items-center gap-1.5 rounded-xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary lg:w-[78px]";
            return (
              <li key={c.id} className="shrink-0">
                {isHome ? (
                  <button type="button" aria-pressed={c.hot ? undefined : on} onClick={() => choose(c)} className={cls}>
                    {inner}
                  </button>
                ) : (
                  <Link href={c.hot ? "/#calendar" : `/categories/${c.id}`} className={cls}>
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
