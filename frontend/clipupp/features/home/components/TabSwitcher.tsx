"use client";

import { Children, useId, useState, type ReactNode } from "react";

/**
 * Client half of block 4. Every panel arrives server-rendered (cards,
 * formatted times, links), so this island only owns which one is visible:
 * switching is a `hidden` toggle, no fetch and no client-side rendering of
 * cards. All panels stay in the HTML for crawlers and no-JS visitors; before
 * hydration only the initial panel is shown.
 */
export function TabSwitcher({
  tabs,
  initial,
  label,
  children,
}: {
  tabs: { slug: string; title: string }[];
  initial: number;
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const [active, setActive] = useState(initial);
  const panels = Children.toArray(children);

  return (
    <div>
      <div role="tablist" aria-label={label} className="clipupp-no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-clipupp-neutral-200">
        {tabs.map((x, i) => {
          const selected = i === active;
          return (
            <button key={x.slug} type="button" role="tab" id={`${id}-tab-${i}`} aria-selected={selected} aria-controls={`${id}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={
                "relative h-11 whitespace-nowrap px-4 text-[15px] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded after:bg-clipupp-primary after:transition-transform after:duration-200 after:content-[''] " +
                (selected ? "text-clipupp-primary after:scale-x-100" : "text-clipupp-neutral-700 after:scale-x-0 hover:text-clipupp-neutral-900")
              }>
              {x.title}
            </button>
          );
        })}
      </div>
      {panels.map((panel, i) => (
        <div key={tabs[i]?.slug ?? i} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== active}>
          {panel}
        </div>
      ))}
    </div>
  );
}
