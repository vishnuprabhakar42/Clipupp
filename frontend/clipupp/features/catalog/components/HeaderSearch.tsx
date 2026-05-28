"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchApi } from "@/lib/api/search";
import type { SearchHit } from "@/lib/api/types";

interface HeaderSearchProps {
  variant?: "default" | "pill";
}

export function HeaderSearch({ variant = "default" }: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await searchApi.suggest(query.trim());
        setResults(hits);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function pathFor(hit: SearchHit) {
    switch (hit.kind) {
      case "STORE":
        return `/stores/${hit.slug}`;
      case "CATEGORY":
        return `/categories/${hit.slug}`;
      default:
        return `/coupons/${hit.slug}`;
    }
  }

  if (variant === "pill") {
    return (
      <div ref={wrapperRef} className="relative w-full">
        <form onSubmit={submit}>
          <div className="flex h-11 overflow-hidden rounded-full border border-border bg-background shadow-sm ring-0 transition focus-within:border-clipupp-primary focus-within:ring-2 focus-within:ring-clipupp-primary/20">
            <span className="grid w-11 shrink-0 place-items-center text-muted-foreground">
              <Search className="h-4 w-4" aria-hidden />
            </span>
            <input
              type="search"
              placeholder="Search stores, coupons, categories…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="m-1.5 grid w-9 shrink-0 place-items-center rounded-full bg-clipupp-primary text-white transition hover:bg-clipupp-primary-strong"
              aria-label="Search"
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </form>
        {open && results.length > 0 && (
          <div className="absolute left-0 right-0 z-dropdown mt-1.5 max-h-96 overflow-y-auto rounded-md border border-clipupp-neutral-200 bg-popover p-1 shadow-card">
            {loading && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>
            )}
            {results.map((hit) => (
              <Link
                key={`${hit.kind}-${hit.id}`}
                href={pathFor(hit)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-accent"
              >
                <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-secondary-foreground">
                  {hit.kind === "COUPON" ? "Coupon" : hit.kind === "STORE" ? "Store" : "Cat"}
                </span>
                <span className="line-clamp-1 flex-1 font-medium">{hit.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <form onSubmit={submit}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stores, coupons, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            className="pl-9"
          />
        </div>
      </form>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 z-dropdown mt-1 max-h-96 overflow-y-auto rounded-md border border-clipupp-neutral-200 bg-popover p-1 shadow-card">
          {loading && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>
          )}
          {results.map((hit) => (
            <Link
              key={`${hit.kind}-${hit.id}`}
              href={pathFor(hit)}
              onClick={() => setOpen(false)}
              className="flex items-start gap-2 rounded px-3 py-2 text-sm hover:bg-accent"
            >
              <span className="mt-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-secondary-foreground">
                {hit.kind === "COUPON" ? "Coupon" : hit.kind === "STORE" ? "Store" : "Category"}
              </span>
              <span className="line-clamp-1 flex-1 font-medium">{hit.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
