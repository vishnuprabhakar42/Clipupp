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
 * Newsletter band — sits on `cv-section-bg-mesh-warm` (amber mesh) so it
 * reads as the hottest CTA strip on the page. White pill form has the
 * crimson-gradient submit nested INSIDE the input on desktop (Substack
 * pattern) and stacked beneath on mobile for tap targets.
 *
 * Server-rendered shell is `'use client'` because the form has interactive
 * state (submitting / submitted) and uses sonner toasts.
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
      className="relative overflow-hidden bg-cv-primary text-white"
    >
      <div className="cv-container py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-cv-accent-800 backdrop-blur-sm">
            <Mail
              className="h-3 w-3 text-cv-accent-700"
              aria-hidden
              strokeWidth={2.5}
            />
            Weekly drop
          </span>

          <h2 className="cv-display-hero mt-5 text-white">{headline}</h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-[15px]">
            {subheadline}
          </p>

          {submitted ? (
            <div
              className="mx-auto mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-display text-sm font-extrabold text-cv-success-strong"
              style={{ boxShadow: "var(--cv-shadow-lifted)" }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              Almost there — check your inbox to confirm.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mx-auto mt-7 max-w-xl">
              {/* Desktop: nested gradient button inside input pill */}
              <div
                className="relative hidden h-16 rounded-full bg-white sm:block"
                style={{ boxShadow: "var(--cv-shadow-lifted)" }}
              >
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
                  className="h-full w-full rounded-full bg-transparent pl-7 pr-[170px] text-[15px] text-cv-neutral-900 outline-none placeholder:text-cv-neutral-400 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="cv-btn-primary-gradient absolute right-2 top-2 h-12 rounded-full px-6"
                >
                  {submitting ? "…" : ctaLabel}
                  {!submitting && (
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>
              </div>

              {/* Mobile: stacked input + full-width gradient button */}
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
                  className="h-12 w-full rounded-full border-[1.5px] border-white/40 bg-white px-5 text-[15px] text-cv-neutral-900 outline-none placeholder:text-cv-neutral-400 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="cv-btn-primary-gradient w-full rounded-full"
                >
                  {submitting ? "Subscribing…" : ctaLabel}
                  {!submitting && <ArrowRight className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </form>
          )}

          <p className="mt-5 text-xs text-white/80">
            Join{" "}
            <span className="font-extrabold text-white">10,000+</span> smart
            shoppers. We never share your email.
          </p>
        </div>
      </div>
    </section>
  );
}
