"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/**
 * The one hot button on every coupon card. Click: reveal the code on the
 * card (via the data-peel sibling), copy it, open the merchant through the
 * affiliate redirect in a new tab, then swap to "Copied ✓ CODE". Deals have
 * no code: skip the clipboard, keep the redirect. Works without clipboard
 * permissions (the catch keeps the UI moving).
 */
export function ShowCodeButton({
  couponId,
  code,
  label,
  className = "",
}: {
  couponId: string;
  code: string | null;
  label: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "opened">("idle");

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    const card = e.currentTarget.closest("[data-coupon-card]");
    card?.querySelector(".clipupp-code-peel")?.classList.add("revealed");
    window.open(`${API_BASE}/r/${couponId}`, "_blank", "noopener,noreferrer");
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
  const text = state === "copied" ? `Copied ${code}` : state === "opened" ? "Opened" : label;

  return (
    <button
      type="button"
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
    </button>
  );
}
