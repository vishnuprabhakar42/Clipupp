"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/**
 * Coupon code reveal CTA — hottest button on a coupon detail page.
 *
 * Click "Reveal code & visit store" → opens the merchant in a new tab via
 * /r/{couponId} (affiliate redirect on backend), auto-copies the code to
 * the clipboard, and switches the UI to a dashed-amber code box with a
 * manual copy button as fallback.
 *
 * Visual tier: amber gradient + always-on pulse-glow when un-revealed; the
 * revealed box gets a dashed amber border. "Copied!" feedback flashes emerald.
 */
export function CouponReveal({
  code,
  couponId,
}: {
  code: string;
  couponId: string;
}) {
  const t = useTranslations("catalog.ui");
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyToClipboard(value: string, opts?: { silent?: boolean }) {
    return navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        if (!opts?.silent) toast.success(`Copied ${value}`);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => toast.error("Could not copy to clipboard"),
    );
  }

  function openMerchant() {
    window.open(`${API_BASE}/r/${couponId}`, "_blank", "noopener,noreferrer");
  }

  if (!revealed) {
    return (
      <button
        type="button"
        className="clipupp-btn-accent-gradient w-full text-[15px] font-extrabold uppercase tracking-wide"
        onClick={() => {
          setRevealed(true);
          openMerchant();
          // Auto-copy on first reveal — couponers expect this.
          void copyToClipboard(code, { silent: false });
        }}
      >
        <Lock className="h-4 w-4" aria-hidden strokeWidth={2.5} />
        Reveal code &amp; visit store
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="flex flex-1 items-center justify-between gap-3 rounded-md border-2 border-dashed border-clipupp-accent-500 bg-clipupp-accent-soft px-4 py-3">
        <code className="font-mono text-[17px] font-extrabold tracking-[0.18em] text-clipupp-accent-800">
          {code}
        </code>
        <button
          type="button"
          onClick={() => void copyToClipboard(code)}
          aria-label={t("copyCode")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-clipupp-accent-700 transition-colors hover:bg-clipupp-accent-100"
        >
          {copied ? (
            <Check className="h-4 w-4 text-clipupp-success-strong" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
      <button
        type="button"
        onClick={openMerchant}
        className="clipupp-btn-ghost text-[13px] font-bold"
      >
        {t("visitMerchant")}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
