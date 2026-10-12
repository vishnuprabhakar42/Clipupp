"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { notify } from "@/components/site/Toast";

/** Copies the partner email; label flips to "Copied" and stays. Failure selects the text and says so. */
export function CopyEmailButton({ email, targetId }: { email: string; targetId: string }) {
  const t = useTranslations("footer");
  const tt = useTranslations("toast");
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setDone(true);
      notify(tt("emailCopied"));
    } catch {
      const el = document.getElementById(targetId);
      if (el) {
        const r = document.createRange();
        r.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
      notify(tt("selectEmail"));
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-11 shrink-0 items-center rounded-full bg-white px-4 text-[14px] font-semibold text-clipupp-ft-bg transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-ft-accent"
    >
      {done ? t("copied") : t("copyEmail")}
    </button>
  );
}
