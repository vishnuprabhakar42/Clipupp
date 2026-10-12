"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Sheet, SheetHeader } from "@/components/site/Sheet";
import { useSavedCoupons } from "@/lib/home/useSavedCoupons";
import { useSavedSheet } from "@/lib/home/useSavedSheet";
import { loadSavedRows } from "../actions/savedRows";

/** Saved coupons sheet, mounted once. Rows are server-rendered CouponCard rows fetched on open. */
export function SavedSheet() {
  const t = useTranslations("sheet");
  const { isOpen, close } = useSavedSheet();
  const { ids } = useSavedCoupons();
  const titleId = useId();
  const [rows, setRows] = useState<Map<string, ReactNode>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    setLoading(true);
    loadSavedRows(ids)
      .then((r) => live && setRows(new Map(r.map((x) => [x.id, x.node]))))
      .catch(() => live && setRows(new Map()))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // Fetch once per open; unsaving inside the sheet only filters the loaded rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const shown = ids.filter((id) => rows.has(id));
  const count = loading && rows.size === 0 ? ids.length : shown.length;

  return (
    <Sheet open={isOpen} onClose={close} labelledBy={titleId} size="auto">
      <SheetHeader titleId={titleId} title={t("savedTitle")} subtitle={t("savedCount", { count })} onClose={close} />
      {shown.length > 0 ? (
        <div className="grid gap-3 px-4 pb-6 pt-2">{shown.map((id) => <div key={id}>{rows.get(id)}</div>)}</div>
      ) : loading && ids.length > 0 ? (
        <div className="px-5 pb-8 pt-4" aria-busy="true">
          <div className="h-24 animate-pulse rounded-2xl bg-clipupp-skel motion-reduce:animate-none" />
        </div>
      ) : (
        <div className="px-5 pb-10 pt-6 text-center">
          <Heart className="mx-auto h-8 w-8 text-clipupp-neutral-400" strokeWidth={1.8} aria-hidden="true" />
          <p className="mt-3 font-bold text-clipupp-neutral-900">{t("savedEmptyTitle")}</p>
          <p className="mt-1 text-sm text-clipupp-neutral-600">{t("savedEmptyBody")}</p>
        </div>
      )}
    </Sheet>
  );
}
