"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { newsletterApi } from "@/lib/api/newsletter";
import { isApiError } from "@/lib/api/errors";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Copy = {
  headline?: string;
  subheadline?: string;
  cta?: string;
};

/**
 * Newsletter band — the bottom lead-gen CTA. Designed to feel like the most
 * polished surface on the page: deep purple field with two soft floating
 * highlights for atmosphere, glass benefit chips above the form, and a tall
 * white form pill with a gradient Subscribe button.
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
  const headline = copy?.headline?.trim() || "Get the best deals weekly";
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
        isApiError(err) ? err.message : "Could not subscribe. Try again later.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-label="Newsletter subscription"
      className="relative isolate overflow-hidden bg-cv-primary text-white"
    >
      {/* Atmospheric layer — two soft radial highlights + a subtle dotted
          mask. All on purpose-built layers so they sit behind the content
          (z-index 0). No images, all CSS. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-40 z-0 h-[28rem] w-[28rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 65%)",
          filter: "blur(8px)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-44 z-0 h-[32rem] w-[32rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(196,181,253,0.38) 0%, rgba(196,181,253,0) 70%)",
          filter: "blur(8px)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(circle at 50% 50%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 50%, black 30%, transparent 75%)",
        }}
      />

      <div className="cv-container relative z-[1] py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-cv-primary-800 backdrop-blur-sm">
            <Mail
              className="h-3 w-3 text-cv-primary-700"
              aria-hidden
              strokeWidth={2.5}
            />
            Weekly drop
          </span>

          <h2 className="cv-display-mega mt-6 text-white">{headline}</h2>

          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/90 sm:text-base">
            {subheadline}
          </p>

          {/* Benefit chips — three glass pills that turn the section from a
              plain CTA into a confident promise. */}
          <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            {[
              { icon: CalendarCheck, label: "Every Sunday" },
              { icon: Sparkles, label: "Editor curated" },
              { icon: ShieldCheck, label: "No spam, ever" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={2.25} />
                {label}
              </li>
            ))}
          </ul>

          {submitted ? (
            <div
              className="mx-auto mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-display text-sm font-extrabold text-cv-success-strong"
              style={{ boxShadow: "var(--cv-shadow-lifted)" }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              Almost there — check your inbox to confirm.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-xl">
              {/* Desktop: nested gradient button inside input pill */}
              <div
                className="group relative hidden h-16 rounded-full bg-white ring-4 ring-white/15 transition-shadow focus-within:ring-8 focus-within:ring-white/25 sm:block"
                style={{ boxShadow: "var(--cv-shadow-lifted)" }}
              >
                <label htmlFor="cv-newsletter-email-d" className="sr-only">
                  Email address
                </label>
                <Mail
                  className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-cv-primary-700"
                  aria-hidden
                  strokeWidth={2}
                />
                <input
                  id="cv-newsletter-email-d"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                  className="h-full w-full rounded-full bg-transparent pl-14 pr-[170px] text-[15px] text-cv-neutral-900 outline-none placeholder:text-cv-neutral-400 disabled:opacity-40"
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
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-cv-primary-700"
                    aria-hidden
                    strokeWidth={2}
                  />
                  <input
                    id="cv-newsletter-email-m"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={submitting}
                    className="h-12 w-full rounded-full border-[1.5px] border-white/40 bg-white pl-12 pr-5 text-[15px] text-cv-neutral-900 outline-none placeholder:text-cv-neutral-400 disabled:opacity-40"
                  />
                </div>
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

          <p className="mt-6 text-xs text-white/80">
            Join{" "}
            <span className="font-extrabold text-white">10,000+</span> smart
            shoppers · We never share your email
          </p>
        </div>
      </div>
    </section>
  );
}
