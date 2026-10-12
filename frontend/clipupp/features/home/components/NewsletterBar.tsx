"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { newsletterApi } from "@/lib/api/newsletter";
import { isApiError } from "@/lib/api/errors";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Copy = { headline?: string; subheadline?: string; cta?: string; whatsapp?: string };

/**
 * Block 7: white newsletter band. Headline from the section row, fallback to
 * the newsletter.* site settings. Form posts through newsletterApi; on
 * success the button reads "Subscribed ✓" and stays disabled.
 */
export function NewsletterBar({ section, copy }: { section?: HomepageSectionPayload | null; copy?: Copy }) {
  const t = useTranslations("home.newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const headline = section?.title?.trim() || copy?.headline || t("defaultHeadline");
  const sub = section?.subtitle?.trim() || copy?.subheadline || "";
  const cta = copy?.cta || t("defaultCta");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state !== "idle" || !email.trim()) return;
    setState("busy");
    try {
      await newsletterApi.subscribe(email.trim(), locale);
      setState("done");
      toast.success(t("success"));
    } catch (err) {
      setState("idle");
      toast.error(isApiError(err) ? err.message : t("error"));
    }
  }

  return (
    <section className="clipupp-container grid items-center gap-8 py-14 lg:grid-cols-2 lg:gap-12 lg:py-24" aria-labelledby="newsletter-heading">
      <div className="clipupp-reveal">
        <span className="block text-[12px] font-medium uppercase tracking-[0.04em] text-clipupp-primary">{t("eyebrow")}</span>
        <h2 id="newsletter-heading" className="font-display text-[clamp(28px,3vw,32px)] font-semibold leading-[1.15] tracking-[-0.02em] text-clipupp-neutral-900">{headline}</h2>
        {sub && <p className="mt-2.5 text-clipupp-neutral-700">{sub}</p>}
      </div>
      <div className="clipupp-reveal" style={{ "--i": 1 } as React.CSSProperties}>
        <form onSubmit={onSubmit} className="flex max-w-[520px] gap-2">
          <label htmlFor="newsletter-email" className="sr-only">{t("emailLabel")}</label>
          <input id="newsletter-email" type="email" required placeholder={t("placeholder")} value={email} onChange={(e) => setEmail(e.target.value)} disabled={state === "done"}
            className="h-12 min-w-0 flex-1 rounded-full border border-clipupp-neutral-200 bg-white px-[18px] text-clipupp-neutral-900 outline-none transition-shadow focus:border-clipupp-primary focus:shadow-[0_0_0_3px_#E7D4F5]" />
          <button type="submit" disabled={state !== "idle"}
            className={"inline-flex h-12 items-center rounded-full px-5 text-[15px] font-medium text-white transition-colors " + (state === "done" ? "bg-clipupp-success" : "bg-clipupp-primary hover:bg-clipupp-primary-strong disabled:opacity-70")}>
            {state === "done" ? t("subscribed") : cta}
          </button>
        </form>
        {copy?.whatsapp && (
          <p className="mt-3.5 text-[14px]">
            <a href={copy.whatsapp} className="font-medium text-clipupp-primary hover:underline">{t("whatsapp")} →</a>
          </p>
        )}
      </div>
    </section>
  );
}
