"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FilterChips } from "@/components/site/FilterChips";
import { Rail } from "@/components/site/Rail";

export type DealEntry = { id: string; store: string; node: ReactNode };

export function DealsRailClient({
  railId,
  entries,
  chips,
}: {
  railId: string;
  entries: DealEntry[];
  chips: { id: string; label: string }[];
}) {
  const t = useTranslations("home.deals");
  const [store, setStore] = useState("all");
  const shown = store === "all" ? entries : entries.filter((e) => e.store === store);
  return (
    <div>
      {chips.length > 1 && (
        <FilterChips
          className="mb-4"
          ariaLabel={t("filterAria")}
          allLabel={t("all")}
          options={chips}
          value={store}
          onChange={setStore}
        />
      )}
      <Rail
        id={railId}
        resetKey={store}
        ariaLabel={t("railAria")}
        cols={{ base: "46%", sm: "30%", md: "23%", lg: "calc((100% - 100px) / 6)" }}
        gap={20}
        className="-mt-3 py-3"
      >
        {shown.map((e) => e.node)}
      </Rail>
    </div>
  );
}
