"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Footer link column. Server markup is always open (links stay in the HTML);
 * below md it collapses after mount and behaves as an accordion, at md+ it is
 * forced open and the summary is inert.
 */
export function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      d.open = mq.matches;
      // The summary is inert at md+: out of the tab order as well as non-clickable.
      summary.current?.setAttribute("tabindex", mq.matches ? "-1" : "0");
    };
    const guard = () => {
      if (mq.matches && !d.open) d.open = true;
    };
    sync();
    mq.addEventListener("change", sync);
    d.addEventListener("toggle", guard);
    return () => {
      mq.removeEventListener("change", sync);
      d.removeEventListener("toggle", guard);
    };
  }, []);

  return (
    <details ref={ref} open className="group border-b border-[color:var(--clipupp-ft-line)] md:border-b-0">
      <summary ref={summary} className="flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded text-[12px] font-semibold uppercase tracking-[0.08em] text-clipupp-ft-ink marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-ft-accent md:pointer-events-none md:min-h-0 md:pb-3 [&::-webkit-details-marker]:hidden">
        <h3 className="text-inherit">{title}</h3>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-clipupp-ft-ink-3 transition-transform duration-200 group-open:rotate-45 md:hidden motion-reduce:transition-none">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </summary>
      <ul className="grid grid-cols-2 gap-x-4 pb-3 md:block md:pb-0">{children}</ul>
    </details>
  );
}
