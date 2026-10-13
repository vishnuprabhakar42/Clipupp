"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { FilterChips } from "@/components/site/FilterChips";
import { Rail } from "@/components/site/Rail";

export type BankEntry = { id: string; bank: string; node: ReactNode };

export function BankOffersRailClient({
  railId,
  entries,
  chips,
}: {
  railId: string;
  entries: BankEntry[];
  chips: { id: string; label: string }[];
}) {
  const t = useTranslations("home.bank");
  const [bank, setBank] = useState("all");
  const shown = bank === "all" ? entries : entries.filter((e) => e.bank === bank);
  return (
    <div>
      {chips.length > 1 && (
        <FilterChips
          className="mb-4"
          ariaLabel={t("filterAria")}
          allLabel={t("all")}
          options={chips}
          value={bank}
          onChange={setBank}
        />
      )}
      <Rail
        id={railId}
        resetKey={bank}
        ariaLabel={t("railAria")}
        cols={{ base: "76%", sm: "44%", md: "32%", lg: "calc((100% - 72px) / 4)" }}
        gap={{ base: 16, lg: 24 }}
        className="-mt-3 py-3"
      >
        {shown.map((e) => e.node)}
      </Rail>
    </div>
  );
}
