"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Filter, Globe, X } from "lucide-react";
import { categoriesApi } from "@/lib/api/categories";

const COUNTRY_OPTIONS = [
  { value: "", label: "All regions" },
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AE", label: "UAE" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "SG", label: "Singapore" },
];

export function StoreFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [, startTransition] = useTransition();

  const country = search.get("country") ?? "";
  const category = search.get("category") ?? "";

  const categories = useQuery({
    queryKey: ["nav", "categories"],
    queryFn: () => categoriesApi.tree(),
    staleTime: 10 * 60_000,
  });

  function commit(next: URLSearchParams) {
    next.delete("cursor");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function setCountry(v: string) {
    const next = new URLSearchParams(search.toString());
    if (!v) next.delete("country");
    else next.set("country", v);
    commit(next);
  }

  function setCategory(v: string) {
    const next = new URLSearchParams(search.toString());
    if (!v) next.delete("category");
    else next.set("category", v);
    commit(next);
  }

  function clear() {
    const next = new URLSearchParams(search.toString());
    next.delete("country");
    next.delete("category");
    commit(next);
  }

  const hasActive = country !== "" || category !== "";

  return (
    <div className="sticky top-[4.5rem] z-20 -mx-4 mb-6 border-y bg-background/95 px-4 py-3 backdrop-blur lg:top-[7rem]">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Filter className="h-3.5 w-3.5" aria-hidden />
          Filter
        </span>
        <label className="inline-flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Filter stores by region"
            className="rounded-full border bg-background px-3 py-1 text-xs"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter stores by category"
          className="rounded-full border bg-background px-3 py-1 text-xs"
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
        {hasActive && (
          <button
            type="button"
            onClick={clear}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent"
          >
            <X className="h-3 w-3" aria-hidden />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
