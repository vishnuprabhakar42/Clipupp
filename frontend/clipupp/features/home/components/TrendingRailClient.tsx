"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FilterChips } from "@/components/site/FilterChips";
import { Rail } from "@/components/site/Rail";
import { pickTrending, type TrendingEntry } from "../lib/pickTrending";

export type { TrendingEntry };

export function TrendingRailClient({
  railId,
  entries,
  chips,
}: {
  railId: string;
  entries: TrendingEntry[];
  chips: { id: string; label: string; title: string }[];
}) {
  const t = useTranslations("home.trending");
  const [cat, setCat] = useState("all");
  const shown = useMemo(() => pickTrending(entries, cat), [entries, cat]);

  return (
    <div>
      {chips.length > 1 && (
        <FilterChips
          className="mb-4"
          ariaLabel={t("filterAria")}
          allLabel={t("all")}
          options={chips}
          value={cat}
          onChange={setCat}
        />
      )}
      <Rail
        id={railId}
        resetKey={cat}
        ariaLabel={t("railAria")}
        cols={{ base: "80%", sm: "46%", lg: "calc((100% - 72px) / 4)" }}
        gap={{ base: 16, lg: 24 }}
        className="-mt-3 py-3"
      >
        {shown.map((e) => e.node)}
      </Rail>
    </div>
  );
}
