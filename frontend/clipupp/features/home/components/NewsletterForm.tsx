"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { newsletterApi } from "@/lib/api/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Weekly email form: client validation, then newsletterApi.subscribe. Messages are aria-live. */
export function NewsletterForm() {
  const t = useTranslations("home.alerts");
  const locale = useLocale();
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "bad" | "fail">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    const v = email.trim();
    if (!EMAIL_RE.test(v)) {
      setState("bad");
      return;
    }
    setState("busy");
    try {
      await newsletterApi.subscribe(v, locale);
      setState("ok");
      setEmail("");
    } catch {
      setState("fail");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">{t("mailLabel")}</label>
        <input
          id={id}
          type="email"
          autoComplete="email"
          placeholder={t("mailPlaceholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "bad" || state === "fail") setState("idle");
          }}
          aria-invalid={state === "bad"}
          className="h-12 min-w-0 rounded-full sm:flex-1 border border-clipupp-neutral-200 bg-clipupp-surface px-[18px] text-[16px] text-clipupp-neutral-900 outline-none transition-shadow placeholder:text-clipupp-neutral-500 focus:border-clipupp-primary focus:shadow-[0_0_0_3px_rgb(var(--clipupp-primary-rgb)/0.2)]"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="inline-flex h-12 items-center justify-center rounded-full bg-clipupp-primary px-6 text-[15px] font-semibold text-clipupp-primary-fg transition-colors hover:bg-clipupp-primary-strong disabled:opacity-70"
        >
          {t("mailCta")}
        </button>
      </div>
      <p aria-live="polite" className={"mt-2 min-h-[20px] text-[14px] " + (state === "ok" ? "text-clipupp-success" : "text-clipupp-danger")}>
        {state === "ok" ? t("mailOk") : state === "bad" ? t("mailBad") : state === "fail" ? t("mailFail") : ""}
      </p>
    </form>
  );
}
