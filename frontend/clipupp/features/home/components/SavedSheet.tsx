"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Sheet, SheetHeader } from "@/components/site/Sheet";
import { Link } from "@/lib/i18n/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CouponRow } from "@/features/catalog/components/CouponRow";
import { useSavedCoupons } from "@/lib/home/useSavedCoupons";
import { useSavedSheet } from "@/lib/home/useSavedSheet";
import { expandSeedCoupon, expandSeedStore } from "@/lib/home/savedSeed";
import { loadSavedRows } from "../actions/savedRows";

/**
 * Saved coupons sheet, mounted once. Rows resolve against the feed slices the
 * homepage seeded (`SavedSheetSeed`); ids absent from the seed go through the
 * `loadSavedRows` action once per open (and again on Retry). For guests that
 * lookup also runs while closed, so the badge (`useSavedCount`) only counts
 * rows the sheet can show. Signed in, ids that still cannot render are
 * covered by a link to the account page. Loaded lazily by `BottomNavClient`,
 * which also closes it on route changes.
 */
export function SavedSheet() {
  const t = useTranslations("sheet");
  const { isOpen, close, coupons, stores, categories, unresolved, setUnresolved } = useSavedSheet();
  const { ids, hydrated } = useSavedCoupons();
  const { user } = useAuth();
  const signedIn = !!user;
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

  // Open: ask for every id without a row. Closed (guests only): ask only for
  // ids not already known to be unresolvable, so this settles after one call.
  const pending = ids.filter((id) => !seeded.has(id) && !extra.has(id));
  const toAsk = isOpen ? pending : signedIn ? [] : pending.filter((id) => !unresolved.includes(id));
  const askKey = toAsk.join(",");

  useEffect(() => {
    if (!hydrated) return;
    if (!askKey) {
      setFailed(false);
      setLoading(false);
      return;
    }
    let live = true;
    if (isOpen) {
      setLoading(true);
      setFailed(false);
    }
    const asked = askKey.split(",");
    loadSavedRows(asked)
      .then((r) => {
        if (!live) return;
        setExtra((prev) => {
          const next = new Map(prev);
          for (const x of r.rows) next.set(x.id, x.node);
          return next;
        });
        // Merge: ids not asked this time keep their earlier verdict.
        const prev = useSavedSheet.getState().unresolved.filter((id) => !asked.includes(id));
        setUnresolved([...prev, ...r.unresolved]);
      })
      .catch(() => live && isOpen && setFailed(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // Keyed on the ids asked for: unsaving inside the sheet only filters rows.
  }, [askKey, isOpen, tick, hydrated, setUnresolved]);

  const node = (id: string) => seeded.get(id) ?? extra.get(id);
  const shown = ids.filter((id) => node(id));
  const missing = ids.length - shown.length;
  // Signed in, the rows the sheet cannot render sit behind the account link, so the count is every saved id.
  const linkAll = signedIn && missing > 0 && !loading;
  const count = signedIn || (loading && shown.length === 0) ? ids.length : shown.length;

  return (
    <Sheet open={isOpen} onClose={close} labelledBy={titleId} size="auto">
      <SheetHeader titleId={titleId} title={t("savedTitle")} subtitle={t("savedCount", { count })} onClose={close} />
      {shown.length > 0 && <div className="grid gap-3 px-4 pb-6 pt-2">{shown.map((id) => <div key={id}>{node(id)}</div>)}</div>}
      {linkAll && (
        <div className={`px-5 pb-8 text-center ${shown.length > 0 ? "" : "pt-6"}`}>
          <Link
            href="/account/saved-coupons"
            onClick={close}
            className="inline-flex h-11 items-center rounded-full border border-clipupp-primary px-5 text-[14px] font-semibold text-clipupp-primary clipupp-press hover:bg-clipupp-primary-100"
          >
            {t("savedSeeAll", { count: ids.length })}
          </Link>
        </div>
      )}
      {failed && ids.length > 0 ? (
        <div role="alert" className="px-5 pb-8 pt-4 text-center">
          <p className="text-sm text-clipupp-neutral-700">{t("savedError")}</p>
          <button
            type="button"
            onClick={() => setTick((n) => n + 1)}
            className="mt-3 inline-flex h-11 items-center rounded-full bg-clipupp-primary px-5 text-[14px] font-semibold text-clipupp-primary-fg clipupp-press hover:bg-clipupp-primary-strong"
          >
            {t("retry")}
          </button>
        </div>
      ) : loading && shown.length === 0 && ids.length > 0 ? (
        <div className="px-5 pb-8 pt-4" aria-busy="true">
          <div className="h-24 animate-pulse rounded-2xl bg-clipupp-skel motion-reduce:animate-none" />
        </div>
      ) : shown.length === 0 && !linkAll ? (
        <div className="px-5 pb-10 pt-6 text-center">
          <Heart className="mx-auto h-8 w-8 text-clipupp-neutral-400" strokeWidth={1.8} aria-hidden="true" />
          <p className="mt-3 font-bold text-clipupp-neutral-900">{t("savedEmptyTitle")}</p>
          <p className="mt-1 text-sm text-clipupp-neutral-600">{t("savedEmptyBody")}</p>
        </div>
      ) : null}
    </Sheet>
  );
}
