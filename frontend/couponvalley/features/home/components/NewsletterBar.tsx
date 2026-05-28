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
 * Newsletter band — the bottom lead-gen CTA. Light-lavender field that
 * carries the brand purple without the visual weight of the dark variant.
 * Two soft purple highlights + a faint dot pattern give the field depth;
 * three glass benefit chips above the form turn the ask into a three-
 * promise commitment.
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
      className="relative isolate overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 50%, #EDE9FE 100%)",
      }}
    >
      {/* Atmospheric layer — two soft lavender orbs anchor the field. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-40 z-0 h-[28rem] w-[28rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(196,181,253,0.55) 0%, rgba(196,181,253,0) 65%)",
          filter: "blur(8px)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-44 z-0 h-[32rem] w-[32rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(167,139,250,0.45) 0%, rgba(167,139,250,0) 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Brand-themed wallpaper — single SVG pattern tiled across the whole
          section. Each 90 × 70 px tile carries four coupon-site icons
          (paperclip, percent, tag, ticket) so a typical viewport renders
          1000+ icons of brand chrome. Centre-masked so the icons fade near
          the content for legibility. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full text-cv-primary-400"
        style={{
          maskImage:
            "radial-gradient(ellipse 60% 65% at 50% 50%, transparent 0%, transparent 25%, black 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 65% at 50% 50%, transparent 0%, transparent 25%, black 80%)",
        }}
      >
        <defs>
          <pattern
            id="cv-newsletter-tile"
            width="90"
            height="70"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-6)"
          >
            {/* paperclip — brand mark */}
            <path
              d="M8 10 L8 24 A3.6 3.6 0 0 0 15.2 24 L15.2 14.4 A2.8 2.8 0 0 0 9.6 14.4 L9.6 21.6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.35}
            />
            {/* % symbol */}
            <g transform="translate(55, 8)" opacity={0.32}>
              <circle cx="2.5" cy="2.5" r="2" fill="none" stroke="currentColor" strokeWidth={1.4} />
              <circle cx="11.5" cy="11.5" r="2" fill="none" stroke="currentColor" strokeWidth={1.4} />
              <line x1="2" y1="13" x2="12" y2="1" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
            </g>
            {/* tag — translated lower-left */}
            <g transform="translate(12, 44) rotate(8)" opacity={0.3}>
              <path
                d="M0 4 L4 0 L13 0 L13 9 L9 13 L0 13 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
              <circle cx="9.5" cy="3.5" r="0.9" fill="currentColor" />
            </g>
            {/* ticket — translated lower-right */}
            <g transform="translate(58, 42) rotate(-10)" opacity={0.3}>
              <path
                d="M1 4 Q1 2 3 2 L21 2 Q23 2 23 4 L23 6 Q21 6 21 8 Q21 10 23 10 L23 12 Q23 14 21 14 L3 14 Q1 14 1 12 L1 10 Q3 10 3 8 Q3 6 1 6 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.3}
                strokeLinejoin="round"
              />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cv-newsletter-tile)" />
      </svg>

      <div className="cv-container relative z-[1] py-10 md:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cv-primary-200 bg-white px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-cv-primary-800 shadow-resting">
            <Mail
              className="h-3 w-3 text-cv-primary-700"
              aria-hidden
              strokeWidth={2.5}
            />
            Weekly drop
          </span>

          <h2 className="cv-display-hero mt-4 text-cv-neutral-900">
            {headline}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-[14px] leading-relaxed text-cv-neutral-700 sm:text-[15px]">
            {subheadline}
          </p>

          {/* Benefit chips — three white pills with soft purple borders. */}
          <ul className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            {[
              { icon: CalendarCheck, label: "Every Sunday" },
              { icon: Sparkles, label: "Editor curated" },
              { icon: ShieldCheck, label: "No spam, ever" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-cv-primary-200 bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-cv-neutral-800 backdrop-blur-md shadow-resting"
              >
                <Icon
                  className="h-3.5 w-3.5 text-cv-primary-700"
                  aria-hidden
                  strokeWidth={2.25}
                />
                {label}
              </li>
            ))}
          </ul>

          {submitted ? (
            <div
              className="mx-auto mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-cv-success-soft bg-white px-6 py-3 font-display text-sm font-extrabold text-cv-success-strong"
              style={{ boxShadow: "var(--cv-shadow-lifted)" }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              Almost there — check your inbox to confirm.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mx-auto mt-6 max-w-xl">
              {/* Desktop: nested gradient button inside input pill */}
              <div
                className="group relative hidden h-16 rounded-full border border-cv-primary-200 bg-white ring-4 ring-cv-primary-100 transition-shadow focus-within:ring-8 focus-within:ring-cv-primary-200 sm:block"
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
                    className="h-12 w-full rounded-full border-[1.5px] border-cv-primary-200 bg-white pl-12 pr-5 text-[15px] text-cv-neutral-900 outline-none placeholder:text-cv-neutral-400 disabled:opacity-40"
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

          <p className="mt-4 text-xs text-cv-neutral-600">
            Join{" "}
            <span className="font-extrabold text-cv-neutral-900">10,000+</span>{" "}
            smart shoppers · We never share your email
          </p>
        </div>
      </div>
    </section>
  );
}
