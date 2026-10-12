"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Sheet, SheetHeader } from "@/components/site/Sheet";
import { notify } from "@/components/site/Toast";
import { apiClient } from "@/lib/api/client";
import { timeAgo } from "@/lib/format/timeAgo";
import { shortCount } from "@/lib/format/short";
import { wrapNumbers } from "@/lib/format/wrapNumbers";
import type { FeedCoupon, FeedStore } from "@/lib/home/feed";
import { useCouponSheet } from "@/lib/home/useCouponSheet";
import { useRevealed } from "@/lib/home/useRevealed";
import { SaveHeart } from "./SaveHeart";
import { StoreTile } from "./StoreTile";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TITLE_ID = "coupon-sheet-title";

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Mount once in the public layout. Opens through `useCouponSheet().open`. */
export function CouponSheetProvider() {
  const { coupon, store, category, isOpen, close } = useCouponSheet();
  return (
    <Sheet open={isOpen} onClose={close} labelledBy={TITLE_ID}>
      {isOpen && coupon && store ? (
        <CouponSheetBody key={coupon.id} coupon={coupon} store={store} category={category} onClose={close} />
      ) : null}
    </Sheet>
  );
}

function CouponSheetBody({
  coupon,
  store,
  category,
  onClose,
}: {
  coupon: FeedCoupon;
  store: FeedStore;
  category: { name: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations("sheet");
  const tc = useTranslations("catalog.card");
  const tt = useTranslations("toast");
  const { markRevealed } = useRevealed();
  const code = coupon.code?.trim() || null;
  const [shown, setShown] = useState(code ?? "");
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ago = timeAgo(coupon.verifiedAt);

  async function copy(): Promise<boolean> {
    if (!code) return false;
    const ok = await copyText(code);
    if (ok) {
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2200);
      notify(tt("codeCopied", { code }));
    } else {
      const el = codeRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      notify(tt("codeSelected"));
    }
    return ok;
  }

  // On open: mark revealed, copy, focus Copy, scramble the code once.
  useEffect(() => {
    markRevealed(coupon.id);
    if (!code) return;
    void copy();
    copyRef.current?.focus();
    if (reducedMotion()) return;
    const start = performance.now();
    const id = setInterval(() => {
      if (performance.now() - start >= 520) {
        setShown(code);
        clearInterval(id);
        return;
      }
      setShown(
        Array.from(code, (c) => (c === " " || c === "-" ? c : ALPHABET[Math.floor(Math.random() * ALPHABET.length)])).join(""),
      );
    }, 45);
    return () => {
      clearInterval(id);
      setShown(code);
    };
    // Runs once per coupon: the body is keyed by coupon id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  async function vote(worked: boolean) {
    setFeedback(worked ? t("thanksYes") : t("thanksNo"));
    if (process.env.NEXT_PUBLIC_COUPON_FEEDBACK !== "true") return;
    try {
      const res = await apiClient.post<{ successRate?: number | null }>(`/api/v1/coupons/${coupon.id}/feedback`, { worked });
      if (res?.successRate != null) setFeedback(`${worked ? t("thanksYes") : t("thanksNo")} ${t("rate", { rate: Math.round(res.successRate) })}`);
    } catch {
      // The local thanks text already shown is enough.
    }
  }

  const meta = [
    ago ? tc("verified", { ago: tc("ago", { unit: ago.unit, n: ago.n }) }) : null,
    coupon.success != null ? tc("success", { rate: coupon.success }) : null,
  ].filter(Boolean);

  return (
    <div className="pb-5">
      <SheetHeader
        title={store.name}
        subtitle={category ? t("couponMeta", { count: store.coupons, category: category.name }) : undefined}
        logo={<StoreTile store={store} size={50} />}
        actions={<SaveHeart couponId={coupon.id} storeName={store.name} />}
        onClose={onClose}
      />
      <div className="px-5">
        <h2 id={TITLE_ID} className="font-display text-[24px] font-semibold leading-tight text-clipupp-neutral-900">
          {wrapNumbers(coupon.title)}
        </h2>
        <p className="mt-1.5 text-[14px] leading-snug text-clipupp-neutral-500">{coupon.terms}</p>

        {code ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-clipupp-primary bg-clipupp-tint-50 py-2.5 pl-4 pr-2.5">
            <span ref={codeRef} className="select-all font-mono text-[21px] font-bold tracking-[0.1em] text-clipupp-primary">
              {shown}
            </span>
            <button
              ref={copyRef}
              type="button"
              onClick={() => void copy()}
              className={
                "inline-flex h-10 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-semibold " +
                (copied
                  ? "clipupp-okpop border-clipupp-success bg-clipupp-ok-bg text-clipupp-success"
                  : "border-clipupp-neutral-200 bg-clipupp-surface text-clipupp-neutral-900 hover:bg-clipupp-neutral-100")
              }
            >
              {copied && <Check size={14} aria-hidden />}
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-clipupp-tint-100 px-4 py-3.5 text-[14px] font-medium text-clipupp-primary">{t("noCode")}</p>
        )}

        <p className="mt-3 flex flex-wrap gap-x-3 text-[12.5px] text-clipupp-neutral-500">
          {meta.length > 0 && <span className="font-medium text-clipupp-success">{meta.join(" · ")}</span>}
          <span>{tc("used", { count: shortCount(coupon.uses) })}</span>
        </p>

        <a
          href={`/r/${coupon.id}`}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          onClick={() => void copy()}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-clipupp-primary px-4 text-[15px] font-semibold text-clipupp-primary-fg transition-colors hover:bg-clipupp-primary-strong"
        >
          {code ? t("openStore", { store: store.name }) : t("shopNow", { store: store.name })}
          <ExternalLink size={16} aria-hidden />
        </a>

        {code && (
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-[13.5px] text-clipupp-neutral-700">
            <li>{t("how1")}</li>
            <li>{t("how2", { store: store.name })}</li>
            <li>{t("how3")}</li>
          </ol>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-clipupp-neutral-200 pt-4">
          <span className="mr-auto text-[13.5px] font-medium text-clipupp-neutral-900" id="coupon-feedback-q">
            {code ? t("feedbackCode") : t("feedbackDeal")}
          </span>
          {feedback ? (
            <p role="status" className="w-full text-[13px] text-clipupp-neutral-700">
              {feedback}
            </p>
          ) : (
            <>
              <button type="button" onClick={() => void vote(true)} className="h-9 rounded-full border border-clipupp-neutral-200 px-4 text-[13px] font-semibold hover:bg-clipupp-neutral-100">
                {t("yes")}
              </button>
              <button type="button" onClick={() => void vote(false)} className="h-9 rounded-full border border-clipupp-neutral-200 px-4 text-[13px] font-semibold hover:bg-clipupp-neutral-100">
                {t("no")}
              </button>
            </>
          )}
        </div>

        <Link
          href={`/stores/${store.id}`}
          onClick={onClose}
          className="mt-3 inline-block text-[13.5px] font-semibold text-clipupp-primary hover:underline"
        >
          {t("seeAll", { count: store.coupons, store: store.name })}
        </Link>
      </div>
    </div>
  );
}
