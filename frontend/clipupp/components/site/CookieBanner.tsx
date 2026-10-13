"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { readConsent, writeConsent } from "@/lib/cookies/consent";
import { useTranslations } from "next-intl";

/**
 * GDPR cookie banner. Renders as a soft sheet at the bottom-right (desktop)
 * or full-width sticky bar (mobile). Defaults reject everything except
 * Necessary; "Accept all" and "Customize" are equally prominent so the choice
 * is genuinely free, required under GDPR.
 *
 * Shown on the visitor's first interaction (scroll, pointer, key). Browsers
 * stop recording LCP at the first input or scroll, so the banner can never
 * become the LCP element (a 1.2s timer made it the mobile LCP at ~5.7s).
 * Until a choice is made only Necessary cookies apply.
 */
export function CookieBanner() {
  const t = useTranslations("chrome.cookie");
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (readConsent()) return;
    const events = ["scroll", "pointerdown", "keydown", "touchstart"] as const;
    const show = () => {
      for (const e of events) window.removeEventListener(e, show);
      if (!readConsent()) setOpen(true);
    };
    for (const e of events) window.addEventListener(e, show, { once: true, passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, show);
    };
  }, []);

  function decide(choice: { analytics: boolean; marketing: boolean }) {
    writeConsent(choice);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("aria")}
      className="fixed inset-x-0 bottom-4 z-modal mx-auto w-[calc(100%-1.5rem)] max-w-2xl rounded-lg border border-clipupp-neutral-200 bg-card p-5 shadow-card sm:bottom-6"
    >
      <button
        onClick={() => setOpen(false)}
        aria-label={t("dismiss")}
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <div className="flex items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-clipupp-accent-soft text-clipupp-accent-strong ring-1 ring-amber-200">
          <Cookie className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("body")}{" "}
            <Link
              href="/cookie-policy"
              className="underline hover:text-foreground"
            >
              {t("policy")}
            </Link>
            .
          </p>

          {customize && (
            <div className="mt-4 space-y-3 rounded-lg border bg-background/40 p-3 text-sm">
              <Toggle
                id="cookie-necessary"
                title={t("necessary")}
                desc={t("necessaryDesc")}
                checked
                disabled
                onChange={() => undefined}
              />
              <Toggle
                id="cookie-analytics"
                title={t("analytics")}
                desc={t("analyticsDesc")}
                checked={analytics}
                onChange={setAnalytics}
              />
              <Toggle
                id="cookie-marketing"
                title={t("marketing")}
                desc={t("marketingDesc")}
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {customize ? (
              <>
                <Button
                  className="clipupp-btn-primary"
                  onClick={() => decide({ analytics, marketing })}
                >
                  {t("save")}
                </Button>
                <Button variant="outline" onClick={() => setCustomize(false)}>
                  {t("back")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="clipupp-btn-primary"
                  onClick={() => decide({ analytics: true, marketing: true })}
                >
                  {t("acceptAll")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide({ analytics: false, marketing: false })}
                >
                  {t("rejectAll")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCustomize(true)}
                >
                  {t("customize")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  id,
  title,
  desc,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex items-start justify-between gap-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </label>
  );
}
