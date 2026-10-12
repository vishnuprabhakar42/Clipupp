"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Sheet, SheetHeader } from "@/components/site/Sheet";
import { CouponRow } from "@/features/catalog/components/CouponRow";
import { useSavedCoupons } from "@/lib/home/useSavedCoupons";
import { useSavedSheet } from "@/lib/home/useSavedSheet";
import { expandSeedCoupon, expandSeedStore } from "@/lib/home/savedSeed";
import { loadSavedRows } from "../actions/savedRows";

/**
 * Saved coupons sheet, mounted once. Rows resolve against the feed slices the
 * homepage seeded (`SavedSheetSeed`); only ids absent from the seed go through the server action,
 * once per open (and again on Retry).
 */
export function SavedSheet() {
  const t = useTranslations("sheet");
  const { isOpen, close, coupons, stores, categories } = useSavedSheet();
  const { ids } = useSavedCoupons();
  const titleId = useId();
  const [extra, setExtra] = useState<Map<string, ReactNode>>(new Map());
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  const seeded = useMemo(() => {
    const st = new Map(stores.map((s) => [s.id, s]));
    const ct = new Map(categories.map((c) => [c.id, c]));
    const m = new Map<string, ReactNode>();
    for (const c of coupons) {
      const store = st.get(c.store);
      if (!store) continue;
      const cat = c.cat ? ct.get(c.cat) : null;
      m.set(
        c.id,
        <CouponRow coupon={expandSeedCoupon(c)} store={expandSeedStore(store)} category={cat ? { name: cat.name } : null} />,
      );
    }
    return m;
  }, [coupons, stores, categories]);

  useEffect(() => {
    if (!isOpen) return;
    const missing = ids.filter((id) => !seeded.has(id));
    if (missing.length === 0) {
      setFailed(false);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    setFailed(false);
    loadSavedRows(missing)
      .then((r) => live && setExtra(new Map(r.map((x) => [x.id, x.node]))))
      .catch(() => live && setFailed(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // Once per open (or retry); unsaving inside the sheet only filters rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tick]);

  const node = (id: string) => seeded.get(id) ?? extra.get(id);
  const shown = ids.filter((id) => node(id));
  const count = loading && shown.length === 0 ? ids.length : shown.length;

  return (
    <Sheet open={isOpen} onClose={close} labelledBy={titleId} size="auto">
      <SheetHeader titleId={titleId} title={t("savedTitle")} subtitle={t("savedCount", { count })} onClose={close} />
      {shown.length > 0 && <div className="grid gap-3 px-4 pb-6 pt-2">{shown.map((id) => <div key={id}>{node(id)}</div>)}</div>}
      {failed && ids.length > 0 ? (
        <div role="alert" className="px-5 pb-8 pt-4 text-center">
          <p className="text-sm text-clipupp-neutral-700">{t("savedError")}</p>
          <button
            type="button"
            onClick={() => setTick((n) => n + 1)}
            className="mt-3 inline-flex h-11 items-center rounded-full bg-clipupp-primary px-5 text-[14px] font-semibold text-clipupp-primary-fg transition-colors hover:bg-clipupp-primary-strong"
          >
            {t("retry")}
          </button>
        </div>
      ) : loading && shown.length === 0 && ids.length > 0 ? (
        <div className="px-5 pb-8 pt-4" aria-busy="true">
          <div className="h-24 animate-pulse rounded-2xl bg-clipupp-skel motion-reduce:animate-none" />
        </div>
      ) : shown.length === 0 ? (
        <div className="px-5 pb-10 pt-6 text-center">
          <Heart className="mx-auto h-8 w-8 text-clipupp-neutral-400" strokeWidth={1.8} aria-hidden="true" />
          <p className="mt-3 font-bold text-clipupp-neutral-900">{t("savedEmptyTitle")}</p>
          <p className="mt-1 text-sm text-clipupp-neutral-600">{t("savedEmptyBody")}</p>
        </div>
      ) : null}
    </Sheet>
  );
}
