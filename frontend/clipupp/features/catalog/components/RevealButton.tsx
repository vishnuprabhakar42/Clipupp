"use client";

import { useEffect, useRef, useState } from "react";
import { Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeedCoupon, FeedStore } from "@/lib/home/feed";
import { useRevealed } from "@/lib/home/useRevealed";
import { useCouponSheet } from "@/lib/home/useCouponSheet";

const REL = "nofollow sponsored noopener noreferrer";

/**
 * Reveal control for a coupon card. Always a real link to `/r/{id}` so
 * no-JS visitors reach the redirect; with JS the click peels the cover and
 * opens the CouponSheet, where copy and redirect happen.
 */
export function RevealButton({
  coupon,
  store,
  size = "md",
  index = 0,
  category,
}: {
  coupon: FeedCoupon;
  store: FeedStore;
  size?: "md" | "sm";
  /** Card index, spreads the sheen sweep. */
  index?: number;
  category?: { name: string } | null;
}) {
  const t = useTranslations("catalog.card");
  const { isRevealed, markRevealed } = useRevealed();
  const open = useCouponSheet((s) => s.open);
  const [peeling, setPeeling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const code = coupon.code?.trim() || null;
  const h = size === "sm" ? "h-11" : "h-12";
  // Design `.reveal-btn`: 15px label and code, 14px inside list rows.
  const fs = size === "sm" ? "text-[14px]" : "text-[15px]";
  const href = `/r/${coupon.id}`;
  const revealed = !!code && (isRevealed(coupon.id) || peeling);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function openSheet(copy: Promise<void> | null) {
    markRevealed(coupon.id);
    open(coupon, store, category ?? null, { copy });
    setPeeling(false);
  }

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle new-tab gestures natively.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!code) {
      openSheet(null);
      return;
    }
    // Copy synchronously inside the click gesture (Safari and iOS require it).
    let copy: Promise<void> | null = null;
    try {
      copy = navigator.clipboard?.writeText(code) ?? null;
      // The sheet awaits this promise; keep an early handler so it never goes unhandled.
      copy?.catch(() => {});
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || isRevealed(coupon.id)) {
      openSheet(copy);
      return;
    }
    setPeeling(true);
    navigator.vibrate?.(12);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => openSheet(copy), 360);
  }

  if (!code) {
    return (
      <a
        href={href}
        target="_blank"
        rel={REL}
        onClick={onClick}
        className={`inline-flex ${h} w-full items-center justify-center rounded-xl bg-clipupp-primary px-4 ${fs} font-semibold text-clipupp-primary-fg transition-colors hover:bg-clipupp-primary-strong`}
      >
        {t("getDeal")}
      </a>
    );
  }

  if (isRevealed(coupon.id) && !peeling) {
    return (
      <a
        href={href}
        target="_blank"
        rel={REL}
        onClick={onClick}
        aria-label={t("codeLabelFull", { code })}
        className={`flex ${h} w-full items-center justify-center rounded-xl border-[1.5px] border-dashed border-clipupp-success bg-clipupp-ok-bg px-3 ${fs} font-bold tracking-[0.08em] text-clipupp-success`}
      >
        {code}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel={REL}
      onClick={onClick}
      aria-label={t("showCodeFor", { store: store.name })}
      style={{ "--d": `${(index % 6) * 0.55}s` } as React.CSSProperties}
      className={`group relative flex ${h} w-full items-center overflow-hidden rounded-xl border-[1.5px] border-dashed border-clipupp-primary bg-clipupp-tint-50`}
    >
      <span
        aria-hidden
        className={
          `clipupp-sheen absolute inset-y-0 left-0 z-10 flex w-[calc(100%-54px)] items-center justify-center gap-1.5 bg-clipupp-primary ${fs} font-semibold text-clipupp-primary-fg transition-transform duration-200 [clip-path:polygon(0_0,100%_0,calc(100%-18px)_100%,0_100%)] motion-reduce:transition-none lg:group-hover:-translate-x-3 ` +
          (peeling ? "clipupp-peel" : "")
        }
      >
        <Tag size={14} aria-hidden />
        {t("showCode")}
      </span>
      <span
        className={
          `ml-auto pr-3.5 ${fs} font-bold tracking-[0.08em] text-clipupp-primary tabular-nums ` +
          (peeling ? "clipupp-code-in mx-auto pr-0" : "")
        }
      >
        {peeling ? code : code.slice(-3)}
      </span>
    </a>
  );
}
