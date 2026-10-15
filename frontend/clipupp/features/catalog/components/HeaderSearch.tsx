"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Landmark, Search, X } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { searchApi } from "@/lib/api/search";
import { highlight } from "@/lib/format/highlight";
import { cn } from "@/lib/utils";

export type SearchStore = { id: string; name: string; coupons: number; popular: number | null };
export type SearchCoupon = { id: string; slug: string; title: string; code: string | null; storeName: string };
export type SearchDeal = { id: string; title: string; price: number };
export type HeaderSearchFeed = {
  stores: SearchStore[];
  coupons: SearchCoupon[];
  deals: SearchDeal[];
  bankOfferCount: number;
  /** In-page bank offers anchor, null when that block does not render (the jump is hidden). */
  bankHref: string | null;
  /** Where deal suggestions go: the deals block when it renders, else the offers route. */
  dealsHref: string;
};

interface HeaderSearchProps {
  variant?: "default" | "pill" | "hero";
  feed?: HeaderSearchFeed;
  className?: string;
  /** Overrides the placeholder (hero). */
  placeholder?: string;
  /** Hero only: label of the submit button inside the pill. */
  ctaLabel?: string;
  /** Accessible name of the search landmark (the hero passes its own). */
  "aria-label"?: string;
}

type Opt = {
  key: string;
  group: "recent" | "popular" | "jump" | "stores" | "coupons" | "deals";
  label: string;
  meta?: string;
  href?: string;
  query?: string;
};

const RECENT_KEY = "clipupp:recent";
const BANK_RE = /bank|card|hdfc|sbi|icici|axis|kotak|rbl/i;
const sectionTitle = "pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-clipupp-neutral-500";
type Section = { id: string; title: string; from: number; to: number };
type View = { options: Opt[]; sections: Section[]; noResults: boolean; typed: boolean };
const EMPTY_VIEW: View = { options: [], sections: [], noResults: false, typed: false };
const EMPTY_FEED: HeaderSearchFeed = { stores: [], coupons: [], deals: [], bankOfferCount: 0, bankHref: null, dealsHref: "/offers" };

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function HeaderSearch({
  variant = "pill",
  feed = EMPTY_FEED,
  className,
  placeholder,
  ctaLabel,
  "aria-label": ariaLabel,
}: HeaderSearchProps) {
  const t = useTranslations("header");
  const router = useRouter();
  const uid = useId();
  const listId = `${uid}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const blurTimer = useRef<number | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [remote, setRemote] = useState<{ q: string; hits: { id: string; slug: string; title: string }[] }>({
    q: "",
    hits: [],
  });

  useEffect(() => setRecent(readRecent()), []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 60);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) return;
    let cancelled = false;
    searchApi
      .suggest(debounced)
      .then((hits) => {
        if (cancelled) return;
        setRemote({
          q: debounced,
          hits: hits.filter((h) => h.kind === "COUPON").map((h) => ({ id: String(h.id), slug: h.slug, title: h.title })),
        });
      })
      .catch(() => {
        if (!cancelled) setRemote({ q: debounced, hits: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // "/" focuses the search from anywhere outside a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (variant === "hero") return;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [variant]);

  const q = debounced;
  const typed = q.length > 0;

  // Suggest is in flight for this query: an empty local result is not yet "no results".
  const pending = q.length >= 2 && remote.q !== q;

  const fresh = useMemo<View>(() => {
    const opts: Opt[] = [];
    const secs: Section[] = [];
    const add = (id: string, title: string, items: Opt[]) => {
      if (!items.length) return;
      secs.push({ id, title, from: opts.length, to: opts.length + items.length });
      opts.push(...items);
    };
    const popular = (): Opt[] =>
      feed.stores
        .filter((s) => s.popular != null)
        .sort((a, b) => (a.popular ?? 0) - (b.popular ?? 0))
        .slice(0, 4)
        .map((s) => ({
          key: `p-${s.id}`,
          group: "popular" as const,
          label: s.name,
          meta: t("couponCount", { count: s.coupons }),
          href: `/stores/${s.id}`,
        }));
    let none = false;
    if (!typed) {
      add(
        "recent",
        t("recent"),
        recent.map((r) => ({ key: `r-${r}`, group: "recent" as const, label: r, query: r })),
      );
      add("popular", t("popularStores"), popular());
    } else {
      const lq = q.toLowerCase();
      if (BANK_RE.test(q) && feed.bankHref) {
        add("jump", t("jumpTo"), [
          {
            key: "jump-bank",
            group: "jump",
            label: t("jumpBank"),
            meta: t("jumpBankMeta", { count: feed.bankOfferCount }),
            href: feed.bankHref,
          },
        ]);
      }
      add(
        "stores",
        t("groupStores"),
        feed.stores
          .filter((s) => s.name.toLowerCase().includes(lq))
          .slice(0, 5)
          .map((s) => ({
            key: `s-${s.id}`,
            group: "stores" as const,
            label: s.name,
            meta: t("couponCount", { count: s.coupons }),
            href: `/stores/${s.id}`,
          })),
      );
      const seen = new Set<string>();
      const coupons: Opt[] = [];
      const pushCoupon = (slug: string, title: string, meta: string) => {
        if (seen.has(slug) || coupons.length >= 5) return;
        seen.add(slug);
        coupons.push({ key: `c-${slug}`, group: "coupons", label: title, meta, href: `/coupons/${slug}` });
      };
      if (remote.q === q) remote.hits.forEach((h) => pushCoupon(h.slug, h.title, ""));
      feed.coupons.forEach((c) => {
        if (`${c.storeName} ${c.title} ${c.code ?? ""}`.toLowerCase().includes(lq)) pushCoupon(c.slug, c.title, c.storeName);
      });
      add("coupons", t("groupCoupons"), coupons);
      add(
        "deals",
        t("groupDeals"),
        feed.deals
          .filter((d) => d.title.toLowerCase().includes(lq))
          .slice(0, 3)
          .map((d) => ({
            key: `d-${d.id}`,
            group: "deals" as const,
            label: d.title,
            meta: `₹${d.price.toLocaleString("en-IN")}`,
            href: feed.dealsHref,
          })),
      );
      // Nothing matched once the suggest settled: say so, then offer the popular stores as a way out.
      if (!opts.length && q.length >= 2 && !pending) {
        none = true;
        add("popular", t("search.noResultsHint"), popular());
      }
    }
    return { options: opts, sections: secs, noResults: none, typed };
  }, [typed, q, recent, feed, remote, pending, t]);

  // While the suggest is pending with no local hits, keep showing the last settled typed list with
  // matches (or nothing) instead of flashing an empty or no-results panel.
  const settled = useRef<View | null>(null);
  useEffect(() => {
    if (!pending) settled.current = fresh;
  }, [fresh, pending]);
  const last = settled.current;
  const view = pending && !fresh.options.length ? (last?.typed && !last.noResults ? last : EMPTY_VIEW) : fresh;
  const { options, sections, noResults } = view;

  useEffect(() => setActive(-1), [options]);

  useEffect(() => {
    if (active < 0) return;
    document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, uid]);

  const remember = useCallback((text: string) => {
    const v = text.trim();
    if (!v) return;
    const next = [v, ...readRecent().filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 5);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    setRecent(next);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const clearRecent = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* private mode */
    }
    setRecent([]);
    inputRef.current?.focus();
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
    setDebounced("");
    setOpen(true);
    inputRef.current?.focus();
  }, []);

  const pick = useCallback(
    (o: Opt) => {
      close();
      inputRef.current?.blur();
      if (o.group === "recent") {
        remember(o.label);
        setQuery(o.label);
        router.push(`/search?q=${encodeURIComponent(o.label)}`);
        return;
      }
      remember(o.group === "popular" || o.group === "jump" ? o.label : o.group === "coupons" ? query : o.label);
      if (o.href) router.push(o.href);
    },
    [close, remember, router, query],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = query.trim();
    const chosen = active >= 0 ? options[active] : typed && debounced === v ? options[0] : undefined;
    if (chosen) return pick(chosen);
    if (!v) return;
    remember(v);
    close();
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(v)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const n = options.length;
      if (!n) return;
      // Wraps at both ends.
      setActive((a) => (e.key === "ArrowDown" ? (a < 0 ? 0 : (a + 1) % n) : a <= 0 ? n - 1 : a - 1));
    }
  }

  const showPanel = open && (options.length > 0 || noResults);
  const recentSection = sections.find((s) => s.id === "recent");
  const secId = (id: string) => `${uid}-sec-${id}`;
  const hero = variant === "hero";
  const pill = variant === "pill" || hero;

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full", className)}
      // Focus may move between the input, the clear buttons and the CTA without closing the panel.
      onFocus={() => window.clearTimeout(blurTimer.current)}
      onBlur={(e) => {
        if (wrapRef.current?.contains(e.relatedTarget as Node | null)) return;
        blurTimer.current = window.setTimeout(close, 150);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !showPanel) return;
        // Focus first: the input's onFocus reopens the panel, and close() must win the batch.
        inputRef.current?.focus();
        close();
      }}
    >
      <form role="search" aria-label={ariaLabel ?? t("searchLabel")} onSubmit={submit}>
        <div
          className={cn(
            "flex items-center border border-clipupp-neutral-200 transition focus-within:border-clipupp-primary focus-within:bg-clipupp-surface focus-within:ring-2 focus-within:ring-clipupp-primary/20",
            hero
              ? "h-[58px] gap-2.5 bg-clipupp-surface pl-5 pr-[7px] shadow-card"
              : "h-11 gap-2 bg-clipupp-page px-3.5 lg:h-[46px]",
            pill ? "rounded-full" : "rounded-lg",
          )}
        >
          <Search className={cn("shrink-0 text-clipupp-neutral-500", hero ? "h-5 w-5" : "h-[18px] w-[18px]")} strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label={t("searchLabel")}
            aria-expanded={showPanel}
            aria-controls={showPanel ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && active >= 0 ? `${uid}-opt-${active}` : undefined}
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={placeholder ?? t("searchPlaceholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            className={cn("h-full min-w-0 flex-1 bg-transparent text-clipupp-neutral-900 outline-none placeholder:text-clipupp-neutral-500", hero ? "text-[17px]" : "text-base")}
          />
          {query ? (
            <button
              type="button"
              aria-label={t("search.clear")}
              // Keep focus (and the phone keyboard) on the input when tapped.
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearQuery}
              className="group/clear clipupp-press -mx-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-clipupp-neutral-500 outline-none"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full transition-colors group-hover/clear:bg-clipupp-neutral-100 group-focus-visible/clear:ring-2 group-focus-visible/clear:ring-clipupp-primary">
                <X className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          ) : null}
          {!query && !hero ? (
            <kbd
              title={t("kbdHint")}
              className={cn(
                "hidden h-6 min-w-6 shrink-0 place-items-center rounded-md border border-clipupp-neutral-200 bg-clipupp-surface px-1.5 font-mono text-xs text-clipupp-neutral-500 lg:grid",
                focused && "lg:hidden",
              )}
            >
              /
            </kbd>
          ) : null}
          {hero && ctaLabel ? (
            <button
              type="submit"
              className="h-11 shrink-0 rounded-full bg-clipupp-primary px-6 text-[15px] font-semibold text-clipupp-primary-fg clipupp-press hover:bg-clipupp-primary-strong"
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </form>

      {showPanel ? (
        <div
          // Mouse presses inside the panel never steal focus from the input.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-dropdown mt-1.5 max-h-[min(66vh,460px)] overflow-y-auto overscroll-contain rounded-2xl border border-clipupp-neutral-200 bg-clipupp-surface p-2 shadow-clipupp-pop"
        >
          {/* Rows that are not options sit outside the listbox so its children stay options and groups. */}
          {noResults ? (
            // Announced through the always-mounted live region below.
            <p aria-hidden="true" className="px-3 pb-1 pt-3 text-sm font-medium text-clipupp-neutral-900">
              {t("search.noResults", { q: debounced })}
            </p>
          ) : null}
          {recentSection ? (
            <div className="flex items-center justify-between gap-2 pl-3">
              <p id={secId("recent")} className={cn(sectionTitle, "py-0")}>
                {recentSection.title}
              </p>
              <button
                type="button"
                onClick={clearRecent}
                aria-describedby={secId("recent")}
                className="clipupp-press inline-flex min-h-11 items-center rounded-full px-3 text-[13px] font-semibold text-clipupp-primary hover:bg-clipupp-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary"
              >
                {t("search.clearRecent")}
              </button>
            </div>
          ) : null}
          <div id={listId} role="listbox" aria-label={t("searchLabel")}>
            {sections.map((s) => (
              <div key={s.id} role="group" aria-labelledby={secId(s.id)}>
                {s.id === "recent" ? null : (
                  <p id={secId(s.id)} aria-hidden="true" className={cn(sectionTitle, "px-3")}>
                    {s.title}
                  </p>
                )}
                <div className={s.id === "recent" ? "flex flex-wrap gap-2 px-2 pb-1" : undefined}>
                  {options.slice(s.from, s.to).map((o, j) => {
                    const idx = s.from + j;
                    const isActive = idx === active;
                    const isChip = o.group === "recent";
                    return (
                      <div
                        key={o.key}
                        id={`${uid}-opt-${idx}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => pick(o)}
                        onMouseEnter={() => setActive(idx)}
                        className={cn(
                          "cursor-pointer",
                          isChip
                            ? "inline-flex min-h-9 items-center rounded-full border border-clipupp-neutral-200 px-3.5 text-sm"
                            : "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm",
                          isActive ? "bg-clipupp-primary-100" : "hover:bg-clipupp-neutral-100",
                        )}
                      >
                        {o.group === "jump" ? (
                          <Landmark className="h-[18px] w-[18px] shrink-0 text-clipupp-primary" aria-hidden="true" />
                        ) : null}
                        <span className={cn("min-w-0 flex-1 truncate", !isChip && (typed ? "text-clipupp-neutral-700" : "font-medium text-clipupp-neutral-900"))}>
                          {typed ? highlight(o.label, q) : o.label}
                        </span>
                        {o.meta ? (
                          <span className="shrink-0 text-xs text-clipupp-neutral-500">{o.meta}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {/* Mounted up front so assistive tech announces the text when it changes. */}
      <p role="status" className="sr-only">
        {showPanel && noResults ? t("search.noResults", { q: debounced }) : ""}
      </p>
    </div>
  );
}
