"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

/**
 * The one hot button on every coupon card. It is a real link to the
 * same-origin affiliate redirect (`/r/{id}`, proxied to the backend by the
 * Next rewrite), so it works before hydration and without JS, is never
 * popup-blocked, and carries the first-party refresh cookie for click
 * attribution. On click (default navigation is kept): reveal the code on the
 * card via the `.clipupp-code-peel` sibling, copy the code while this tab
 * still has focus, then swap the label. Deals have no code: no clipboard,
 * the label reads "Get deal" and then "Opened".
 */
export function ShowCodeButton({
  couponId,
  code,
  labelKey,
  className = "",
}: {
  couponId: string;
  code: string | null;
  labelKey: "showCode" | "getDeal";
  className?: string;
}) {
  const t = useTranslations("catalog.card");
  const [state, setState] = useState<"idle" | "copied" | "opened">("idle");

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const card = e.currentTarget.closest("[data-coupon-card]");
    card?.querySelectorAll(".clipupp-code-peel").forEach((el) => el.classList.add("revealed"));
    if (code && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(
        () => setState("copied"),
        () => setState("opened")
      );
    } else {
      setState("opened");
    }
  }

  const done = state !== "idle";
  const text = state === "copied" ? t("copied", { code: code ?? "" }) : state === "opened" ? t("opened") : t(labelKey);

  return (
    <a
      href={`/r/${couponId}`}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      onClick={onClick}
      aria-live="polite"
      className={
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none " +
        (done ? "bg-clipupp-success" : "bg-clipupp-primary hover:bg-clipupp-primary-strong") +
        " " + className
      }
    >
      {done && <Check className="h-4 w-4" aria-hidden strokeWidth={2.5} />}
      <span className="tabular-nums">{text}</span>
    </a>
  );
}
