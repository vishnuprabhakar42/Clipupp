"use client";

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

export function FilterChips({ options, value, onChange, ariaLabel, allLabel, className = "" }: FilterChipsProps) {
  const all: FilterChipOption[] = allLabel ? [{ id: "all", label: allLabel }, ...options] : options;
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {all.map((o) => {
        const selected = o.id === value || (o.id === "all" && value === "");
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.id)}
            className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-4 text-[14px] font-medium transition-colors ${
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
  );
}
