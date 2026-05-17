"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Mail } from "lucide-react";
import { newsletterApi } from "@/lib/api/newsletter";
import { isApiError } from "@/lib/api/errors";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Copy = {
  headline?: string;
  subheadline?: string;
  cta?: string;
};

/**
 * Slim inline newsletter strip. Copy comes from the admin-managed
 * `newsletter.*` settings (passed in as `copy` from the server) with
 * built-in fallbacks. The optional `section` prop is kept for API symmetry.
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
  const subheadline = copy?.subheadline?.trim() || "One email. No spam. Unsubscribe anytime.";
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
      className="rounded-md border border-gray-200 bg-white p-5 sm:p-6"
    >
      <div className="grid items-center gap-5 lg:grid-cols-[1fr_1.4fr]">
        {/* Left */}
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-cv-accent/10 text-cv-accent">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-base font-bold text-gray-900">{headline}</p>
            <p className="text-sm text-cv-neutral-500">{subheadline}</p>
          </div>
        </div>

        {/* Right */}
        {submitted ? (
          <div className="flex items-center gap-2 rounded-lg bg-cv-success-soft px-3 py-2 text-sm text-cv-success-strong ring-1 ring-cv-success/30">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            <span>Almost there — check your inbox to confirm.</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex w-full gap-2">
            <label htmlFor="cv-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="cv-newsletter-email"
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={submitting}
              className="h-11 flex-1 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none placeholder:text-cv-neutral-400 focus:border-cv-primary focus:ring-2 focus:ring-cv-primary/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-11 shrink-0 rounded-lg bg-cv-primary px-5 text-sm font-semibold text-white transition hover:bg-cv-primary-strong disabled:opacity-60"
            >
              {submitting ? "…" : ctaLabel}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
