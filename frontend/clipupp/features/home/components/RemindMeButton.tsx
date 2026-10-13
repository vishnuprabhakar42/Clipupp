"use client";

import { Bell, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { notify } from "@/components/site/Toast";

const KEY = "clipupp:bells";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable: the toggle still works for this visit */
  }
}

/** Reminder toggle for a sale that has not opened yet. State lives in localStorage; nothing is sent. */
export function RemindMeButton({ saleId, saleName }: { saleId: string; saleName: string }) {
  const t = useTranslations("home.calendar");
  const tt = useTranslations("toast");
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(read().includes(saleId));
  }, [saleId]);

  function toggle() {
    const ids = read();
    const next = !ids.includes(saleId);
    write(next ? [...ids, saleId] : ids.filter((i) => i !== saleId));
    setOn(next);
    notify(next ? tt("reminderSet", { name: saleName }) : tt("reminderRemoved"));
    try {
      navigator.vibrate?.(12);
    } catch {
      /* not supported */
    }
  }

  const Icon = on ? Check : Bell;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={t("remindAria", { name: saleName })}
      onClick={toggle}
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border text-[14px] font-semibold transition-colors ${
        on
          ? "border-clipupp-success bg-clipupp-ok-bg text-clipupp-ok-fg"
          : "border-clipupp-neutral-200 bg-clipupp-surface text-clipupp-neutral-900 hover:bg-clipupp-neutral-50"
      }`}
    >
      <Icon size={16} aria-hidden />
      {on ? t("reminderSet") : t("remind")}
    </button>
  );
}
