"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ExternalLink } from "lucide-react";
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
import { useReports, type ReportReason } from "@/lib/home/useReports";
import { SaveHeart } from "./SaveHeart";
import { StoreTile } from "./StoreTile";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TITLE_ID = "coupon-sheet-title";
const REASONS_ID = "coupon-sheet-report-reasons";
const REASONS: { reason: ReportReason; key: "reasonExpired" | "reasonInvalid" | "reasonMinOrder" | "reasonOther" }[] = [
  { reason: "expired", key: "reasonExpired" },
  { reason: "invalid", key: "reasonInvalid" },
  { reason: "min_order", key: "reasonMinOrder" },
  { reason: "other", key: "reasonOther" },
];
const CHIP_CLASS =
  "clipupp-press h-9 rounded-full border border-clipupp-neutral-200 px-4 text-[13px] font-semibold hover:bg-clipupp-neutral-100";

/** Below lg the sticky bar shows the copy outcome itself, so the success toast would only cover the sheet. */
function barVisible() {
  return !window.matchMedia("(min-width: 1024px)").matches;
}

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

/**
 * The coupon sheet itself. Loaded lazily by `CouponSheetProvider` (mounted
 * once in the locale root layout) on the first open, so cards, the saved
 * sheet and the spotlight share one sheet on every route without shipping it
 * in the first-load bundle. Opens through `useCouponSheet().open`.
 */
export function CouponSheet() {
  const { coupon, store, category, isOpen, seq, copy, close } = useCouponSheet();
  return (
    <Sheet open={isOpen} onClose={close} labelledBy={TITLE_ID}>
      {coupon && store ? (
        <CouponSheetBody
          key={seq}
          coupon={coupon}
          store={store}
          category={category}
          pendingCopy={copy}
          onClose={close}
        />
      ) : null}
    </Sheet>
  );
}

function CouponSheetBody({
  coupon,
  store,
  category,
  pendingCopy,
  onClose,
}: {
  coupon: FeedCoupon;
  store: FeedStore;
  category: { name: string } | null;
  pendingCopy: Promise<void> | null;
  onClose: () => void;
}) {
  const t = useTranslations("sheet");
  const tc = useTranslations("catalog.card");
  const tt = useTranslations("toast");
  const { markRevealed } = useRevealed();
  const code = coupon.code?.trim() || null;
  const [shown, setShown] = useState(code ?? "");
  const [copied, setCopied] = useState(false);
  // Outcome of the last clipboard write; unlike `copied` it does not time out.
  const [wrote, setWrote] = useState(false);
  const { current: reported, report } = useReports(coupon.id);
  const [reportOpen, setReportOpen] = useState(false);
  // True once the visitor reports in this open; a report restored from storage is shown without a live announcement.
  const [justReported, setJustReported] = useState(false);
  const thanksRef = useRef<HTMLParagraphElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const didInit = useRef(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrambleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const ago = timeAgo(coupon.verifiedAt);

  function flashCopied() {
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2200);
  }

  async function copy(pending?: Promise<void> | null): Promise<boolean> {
    if (!code) return false;
    let ok: boolean;
    if (pending) {
      ok = await pending.then(
        () => true,
        () => false,
      );
    } else {
      ok = await copyText(code);
    }
    setWrote(ok);
    if (ok) {
      flashCopied();
      if (!barVisible()) notify(tt("codeCopied", { code }));
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
    if (didInit.current) return;
    didInit.current = true;
    markRevealed(coupon.id);
    if (!code) return;
    void copy(pendingCopy);
    // The dialog opens in the parent's effect, after this one.
    requestAnimationFrame(() => copyRef.current?.focus());
    if (reducedMotion()) return;
    const start = performance.now();
    const id = setInterval(() => {
      if (performance.now() - start >= 520) {
        setShown(code);
        clearInterval(id);
        scrambleTimer.current = null;
        return;
      }
      setShown(
        Array.from(code, (c) => (c === " " || c === "-" ? c : ALPHABET[Math.floor(Math.random() * ALPHABET.length)])).join(""),
      );
    }, 45);
    scrambleTimer.current = id;
    // Runs once per coupon: the body is keyed by the open sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      if (scrambleTimer.current) clearInterval(scrambleTimer.current);
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

  function sendReport(reason: ReportReason) {
    // Kept on this device until the backend phase wires POST /api/v1/coupons/{id}/feedback (v3 spec).
    report(reason);
    setJustReported(true);
    setReportOpen(false);
    requestAnimationFrame(() => thanksRef.current?.focus());
  }

  const storeHref = `/r/${coupon.id}`;
  const meta = [
    ago ? tc("verified", { ago: tc("ago", { unit: ago.unit, n: ago.n }) }) : null,
    coupon.success != null ? tc("success", { rate: coupon.success }) : null,
  ].filter(Boolean);

  return (
    <div className={code ? "pb-5 max-lg:pb-0" : "pb-5"}>
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
                  ? "clipupp-okpop border-clipupp-success bg-clipupp-ok-bg text-clipupp-ok-fg"
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

        {/* Below lg the sticky bar at the bottom carries this link when there is a code. */}
        <a
          href={storeHref}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          onClick={() => void copy()}
          className={`${code ? "max-lg:hidden " : ""}mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-clipupp-primary px-4 text-[15px] font-semibold text-clipupp-primary-fg hover:bg-clipupp-primary-strong`}
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
          <span className="mr-auto text-[13.5px] font-medium text-clipupp-neutral-900">
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

        {reported ? (
          <p ref={thanksRef} tabIndex={-1} role={justReported ? "status" : undefined} className="mt-3 text-[13px] text-clipupp-neutral-700 outline-none">
            {t("reportThanks")}
          </p>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              aria-expanded={reportOpen}
              aria-controls={REASONS_ID}
              onClick={() => setReportOpen((o) => !o)}
              className="clipupp-press group inline-flex min-h-9 items-center gap-1 text-[13px] font-semibold text-clipupp-neutral-600 underline-offset-2 hover:text-clipupp-neutral-900 hover:underline"
            >
              {t("report")}
              <ChevronDown size={15} aria-hidden className="transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none" />
            </button>
            <div id={REASONS_ID} hidden={!reportOpen} role="group" aria-labelledby={`${REASONS_ID}-why`} className="mt-1">
              <p id={`${REASONS_ID}-why`} className="text-[13px] text-clipupp-neutral-600">
                {t("reportWhy")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <button key={r.reason} type="button" onClick={() => sendReport(r.reason)} className={CHIP_CLASS}>
                    {t(r.key)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Link
          href={`/stores/${store.id}`}
          onClick={onClose}
          className="mt-3 inline-block text-[13.5px] font-semibold text-clipupp-primary hover:underline"
        >
          {t("seeAll", { count: store.coupons, store: store.name })}
        </Link>
      </div>

      {code && (
        // Phones and tablets: stays in view while the sheet scrolls, so the store is one tap away.
        <div className="sticky bottom-0 z-10 mt-4 flex items-center gap-3 border-t border-clipupp-neutral-200 bg-clipupp-surface px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 lg:hidden">
          {wrote ? (
            <p className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] font-semibold leading-snug text-clipupp-success">
              <Check size={15} aria-hidden className="shrink-0" />
              <span className="line-clamp-2">{t("copiedBar")}</span>
            </p>
          ) : (
            <p className="min-w-0 flex-1 truncate font-mono text-[14px] font-bold tracking-[0.08em] text-clipupp-primary">{code}</p>
          )}
          <a
            href={storeHref}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            onClick={() => void copy()}
            className="clipupp-press inline-flex h-11 max-w-[58%] shrink-0 items-center gap-1.5 rounded-xl bg-clipupp-primary px-4 text-[14px] font-semibold text-clipupp-primary-fg hover:bg-clipupp-primary-strong"
          >
            <span className="truncate">{t("openStoreBar", { store: store.name })}</span>
            <ExternalLink size={15} aria-hidden className="shrink-0" />
          </a>
        </div>
      )}
    </div>
  );
}
