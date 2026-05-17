"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { readConsent, writeConsent } from "@/lib/cookies/consent";

/**
 * GDPR cookie banner. Renders as a soft sheet at the bottom-right (desktop)
 * or full-width sticky bar (mobile). Defaults reject everything except
 * Necessary; "Accept all" and "Customize" are equally prominent so the choice
 * is genuinely free — required under GDPR.
 *
 * Lazy-rendered on the client only after the document is interactive so it
 * never blocks LCP.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Wait until after first paint so the banner doesn't compete for LCP.
    const handle = window.setTimeout(() => {
      const choice = readConsent();
      if (!choice) setOpen(true);
    }, 1200);
    return () => window.clearTimeout(handle);
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
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-2xl rounded-md border bg-card p-5 shadow-2xl ring-1 ring-black/5 sm:bottom-6"
    >
      <button
        onClick={() => setOpen(false)}
        aria-label="Dismiss without saving"
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <div className="flex items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cv-accent-soft text-cv-accent-strong ring-1 ring-amber-200">
          <Cookie className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold">We respect your privacy</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We use cookies to keep the site running, remember your saved coupons,
            and (with your permission) understand which deals work best.{" "}
            <Link
              href="/cookie-policy"
              className="underline hover:text-foreground"
            >
              Read our cookie policy
            </Link>
            .
          </p>

          {customize && (
            <div className="mt-4 space-y-3 rounded-lg border bg-background/40 p-3 text-sm">
              <Toggle
                id="cookie-necessary"
                title="Necessary"
                desc="Essential for sign-in, saved coupons, and security."
                checked
                disabled
                onChange={() => undefined}
              />
              <Toggle
                id="cookie-analytics"
                title="Analytics"
                desc="Helps us see which deals are useful — never sold."
                checked={analytics}
                onChange={setAnalytics}
              />
              <Toggle
                id="cookie-marketing"
                title="Marketing"
                desc="Personalized recommendations + remarketing on partner sites."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {customize ? (
              <>
                <Button
                  className="cv-btn-primary"
                  onClick={() => decide({ analytics, marketing })}
                >
                  Save preferences
                </Button>
                <Button variant="outline" onClick={() => setCustomize(false)}>
                  Back
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="cv-btn-primary"
                  onClick={() => decide({ analytics: true, marketing: true })}
                >
                  Accept all
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide({ analytics: false, marketing: false })}
                >
                  Reject all
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCustomize(true)}
                >
                  Customize
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
