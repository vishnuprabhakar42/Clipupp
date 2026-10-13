"use client";

import { useRef } from "react";
import { useScrollEdges } from "@/lib/home/useScrollEdges";

export type FilterChipOption = { id: string; label: string };

export type FilterChipsProps = {
  options: FilterChipOption[];
  /** Selected option id; "all" (or "") selects the All chip when `allLabel` is given. */
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  /** When set, a leading chip with id "all" is rendered. */
  allLabel?: string;
  className?: string;
};

/**
 * One scrolling row of filter chips. Edge fades (`.clipupp-fades`) show only on
 * a side that has more chips to scroll to.
 */
export function FilterChips({ options, value, onChange, ariaLabel, allLabel, className = "" }: FilterChipsProps) {
  const all: FilterChipOption[] = allLabel ? [{ id: "all", label: allLabel }, ...options] : options;
  const row = useRef<HTMLDivElement>(null);
  const { atStart, atEnd } = useScrollEdges(row);
  return (
    <div className={`clipupp-fades ${className}`} data-start={atStart ? "" : undefined} data-end={atEnd ? "" : undefined}>
      <div ref={row} role="group" aria-label={ariaLabel} className="clipupp-chiprow clipupp-no-scrollbar flex gap-2 overflow-x-auto">
        {all.map((o) => {
          const selected = o.id === value || (o.id === "all" && value === "");
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.id)}
              className={`clipupp-press h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-[14px] font-medium ${
                selected
                  ? "border-clipupp-neutral-900 bg-clipupp-neutral-900 text-clipupp-surface"
                  : "border-clipupp-neutral-200 bg-clipupp-surface text-clipupp-neutral-900 hover:bg-clipupp-neutral-50"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
