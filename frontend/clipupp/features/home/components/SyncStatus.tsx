"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

/** "Updated {ago}" plus a refresh button that re-renders the server tree. */
export function SyncStatus({ label }: { label: string }) {
  const t = useTranslations("home.today");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-1 text-[13.5px] text-clipupp-neutral-500">
      <span aria-live="polite">{pending ? t("updating") : label}</span>
      <button
        type="button"
        aria-label={t("refresh")}
        disabled={pending}
        onClick={() => start(() => router.refresh())}
        className="grid h-9 w-9 place-items-center rounded-full text-clipupp-neutral-700 transition-colors hover:bg-clipupp-neutral-100"
      >
        <RefreshCw size={16} aria-hidden className={pending ? "clipupp-rot" : ""} />
      </button>
    </div>
  );
}
