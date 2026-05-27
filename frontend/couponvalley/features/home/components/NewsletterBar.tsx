"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { newsletterApi } from "@/lib/api/newsletter";
import { isApiError } from "@/lib/api/errors";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Copy = {
  headline?: string;
  subheadline?: string;
  cta?: string;
};

/**
 * Newsletter band — refined-minimal. Soft warm-to-cool gradient on a
 * light background so dark text is always crisp (no contrast risk). The
 * one distinctive design choice is the form: the Subscribe button is
 * absolutely-positioned INSIDE the input pill (Substack / Resend pattern)
 * so the whole CTA reads as one cohesive element instead of two separate
 * controls. On mobile the button drops below for proper tap targets.
 *
 * Compact vertical rhythm — py-12 to py-16, not the previous chunky
 * py-20+. Everything else is restraint: small eyebrow chip, normal-sized
 * heading, one-line subhead, single trust line.
 */
export function NewsletterBar({
  copy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  section,
}: {
  copy?: Copy;
  section?: HomepageSectionPayload | null;
} = {}) {
  const headline = copy?.headline?.trim() || "Never miss a great deal";
  const subheadline =
    copy?.subheadline?.trim() ||
    "Curated coupons in your inbox every Sunday. No spam, cancel anytime.";
  const ctaLabel = copy?.cta?.trim() || "Subscribe";
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !email.trim()) return;
    setSubmitting(true);
    try {
      await newsletterApi.subscribe(email.trim(), locale);
      setSubmitted(true);
      setEmail("");
      toast.success("Almost there — check your inbox to confirm.");
    } catch (err) {
      toast.error(
        isApiError(err) ? err.message : "Could not subscribe. Try again later."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-label="Newsletter subscription"
      className="relative overflow-hidden bg-cv-primary-soft"
    >
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-xl text-center">
          {/* Eyebrow chip — small, white, ringed. Signals "newsletter"
              without consuming visual space. */}
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-cv-neutral-700 ring-1 ring-cv-neutral-200">
            <Mail className="h-3 w-3 text-cv-primary" aria-hidden />
            Weekly drop
          </span>

          {/* Headline */}
          <h2 className="cv-h2 mt-4">
            {headline}
          </h2>

          {/* Subhead — single line, compact. */}
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cv-neutral-600 sm:text-[15px]">
            {subheadline}
          </p>

          {/* Form / success — the distinctive bit. On sm+ the button lives
              INSIDE the input pill. On mobile it stacks below for proper
              tap targets. */}
          {submitted ? (
            <div className="mx-auto mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-cv-success-soft px-5 py-2.5 text-sm font-semibold text-cv-success-strong ring-1 ring-cv-success/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              Almost there — check your inbox to confirm.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mx-auto mt-6 max-w-md">
              {/* Desktop: nested button inside input pill */}
              <div className="relative hidden sm:block">
                <label htmlFor="cv-newsletter-email-d" className="sr-only">
                  Email address
                </label>
                <input
                  id="cv-newsletter-email-d"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                  className="h-14 w-full rounded-md border-[1.5px] border-cv-neutral-200 bg-white pl-5 pr-[140px] text-[15px] text-cv-neutral-900 outline-none placeholder:text-cv-neutral-400 focus:border-cv-primary focus:ring-2 focus:ring-cv-primary/30 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="absolute right-1.5 top-1.5 inline-flex h-11 items-center gap-1.5 rounded-md bg-cv-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-cv-primary-strong disabled:opacity-40"
                >
                  {submitting ? "…" : ctaLabel}
                  {!submitting && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
                </button>
              </div>

              {/* Mobile: stacked input + full-width button */}
              <div className="flex flex-col gap-2 sm:hidden">
                <label htmlFor="cv-newsletter-email-m" className="sr-only">
                  Email address
                </label>
                <input
                  id="cv-newsletter-email-m"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                  className="h-12 w-full rounded-md border-[1.5px] border-cv-neutral-200 bg-white px-4 text-[15px] text-cv-neutral-900 outline-none placeholder:text-cv-neutral-400 focus:border-cv-primary focus:ring-2 focus:ring-cv-primary/30 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 items-center justify-center gap-1.5 rounded-md bg-cv-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-cv-primary-strong disabled:opacity-40"
                >
                  {submitting ? "Subscribing…" : ctaLabel}
                  {!submitting && <ArrowRight className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </form>
          )}

          {/* Trust line — single short sentence, muted. */}
          <p className="mt-4 text-xs text-cv-neutral-500">
            Join <span className="font-semibold text-cv-neutral-700">10,000+</span> smart shoppers. We never share your email.
          </p>
        </div>
      </div>
    </section>
  );
}
