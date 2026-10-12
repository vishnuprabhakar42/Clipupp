"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { searchApi } from "@/lib/api/search";
import type { SearchHit } from "@/lib/api/types";

/**
 * Hero search with 3-row autosuggest. The form GETs /search?q= so it works
 * without JS; the island only adds suggestions (150ms debounce, max 3) and
 * the empty state. Keyboard: Escape closes, Enter submits.
 */
export function HeroSearch({
  placeholder,
  label,
  cta,
  noResults,
}: {
  placeholder: string;
  label: string;
  cta: string;
  noResults: string;
}) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setOpen(false);
      setSearched(false);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      let next: SearchHit[] = [];
      try {
        next = (await searchApi.suggest(term)).slice(0, 3);
      } catch {
        next = [];
      }
      if (cancelled) return;
      setHits(next);
      setSearchedTerm(term);
      setSearched(true);
      setOpen(true);
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function pathFor(h: SearchHit) {
    if (h.kind === "STORE") return `/stores/${h.slug}`;
    if (h.kind === "CATEGORY") return `/categories/${h.slug}`;
    return `/coupons/${h.slug}`;
  }

  return (
    <div ref={wrap} className="relative max-w-[560px]">
      <form action="/search" method="get" role="search" onSubmit={submit}
        className="flex h-14 items-center gap-2.5 rounded-full border border-clipupp-neutral-200 bg-white pl-5 pr-1.5 transition-shadow focus-within:border-clipupp-primary focus-within:shadow-[0_0_0_3px_#E7D4F5]">
        <Search className="h-5 w-5 shrink-0 text-clipupp-neutral-500" aria-hidden />
        <label htmlFor={id} className="sr-only">{label}</label>
        <input
          id={id}
          name="q"
          type="search"
          autoComplete="off"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => searched && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          className="min-w-0 flex-1 bg-transparent text-[17px] text-clipupp-neutral-900 outline-none placeholder:text-clipupp-neutral-500"
        />
        <button type="submit" className="inline-flex h-11 items-center rounded-full bg-clipupp-primary px-5 text-[15px] font-medium text-white transition-colors hover:bg-clipupp-primary-strong">
          {cta}
        </button>
      </form>
      {open && (
        <div id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-[64px] z-dropdown rounded-xl border border-clipupp-neutral-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(10,22,70,0.10)]">
          {hits.length === 0 ? (
            <p className="px-3 py-2.5 text-[14px] text-clipupp-neutral-700">{noResults.replace("{q}", () => searchedTerm)}</p>
          ) : (
            hits.map((h) => (
              <Link key={`${h.kind}-${h.id}`} href={pathFor(h)} role="option" onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] hover:bg-clipupp-tint-50">
                {h.imageUrl ? (
                  <Image src={h.imageUrl} alt="" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-clipupp-tint-100 text-[11px] font-semibold text-clipupp-primary">
                    {h.title.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="line-clamp-1 flex-1">{h.title}</span>
                <small className="text-clipupp-neutral-500">{h.kind === "STORE" ? "Store" : h.kind === "CATEGORY" ? "Category" : "Coupon"}</small>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
