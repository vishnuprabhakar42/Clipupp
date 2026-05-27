"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { newsletterApi } from "@/lib/api/newsletter";
import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthProvider";

const STORAGE_KEY = "cv_first_visit_done";
const APPEAR_DELAY_MS = 6_000;

/**
 * One-shot newsletter offer for first-time visitors. Skipped automatically
 * for authenticated users (they're past the conversion event we'd be
 * targeting) and for visitors who've already dismissed it on this device.
 *
 * Mounted lazily after the document settles so it never competes for LCP or
 * CLS. Closing or submitting the form persists "done" in localStorage.
 */
export function FirstVisitModal() {
  const auth = useAuth();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.user) return;
    if (!auth.isReady) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    const handle = window.setTimeout(() => setOpen(true), APPEAR_DELAY_MS);
    return () => window.clearTimeout(handle);
  }, [auth.user, auth.isReady]);

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await newsletterApi.subscribe(email.trim(), locale);
      toast.success("Almost there — check your inbox to confirm.");
      dismiss();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not subscribe right now.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-cv-neutral-200 bg-card shadow-card">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-accent"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="bg-cv-primary p-6 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Welcome to CouponValley
          </span>
          <h2 className="mt-3 text-2xl font-bold leading-tight">
            Save smarter — get the best deals first.
          </h2>
          <p className="mt-1.5 text-sm text-white/80">
            Drop your email for a weekly digest of the highest-value coupons
            across 1,000+ stores. One email, hand-curated.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 p-6">
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            aria-label="Email address"
            autoComplete="email"
          />
          <Button type="submit" className="cv-btn-primary w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Get the weekly digest"}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="block w-full text-xs text-muted-foreground hover:text-foreground"
          >
            No thanks, I&apos;ll browse first
          </button>
          <p className="text-[11px] text-muted-foreground">
            We&apos;ll send a confirmation link first — double opt-in. Unsubscribe
            anytime in one click. We never sell your email.
          </p>
        </form>
      </div>
    </div>
  );
}
