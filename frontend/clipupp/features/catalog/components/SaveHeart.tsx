"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSavedCoupons } from "@/lib/home/useSavedCoupons";

/** 44px heart toggle. The saved hook owns the toast and the sync. */
export function SaveHeart({ couponId, storeName, className = "" }: { couponId: string; storeName: string; className?: string }) {
  const t = useTranslations("catalog.card");
  const { has, toggle } = useSavedCoupons();
  const saved = has(couponId);
  const [pop, setPop] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t("unsave", { store: storeName }) : t("save", { store: storeName })}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = toggle(couponId);
        setPop(now);
        if (now) navigator.vibrate?.(12);
      }}
      onAnimationEnd={() => setPop(false)}
      className={
        "grid h-11 w-11 shrink-0 place-items-center rounded-full text-clipupp-neutral-500 transition-colors hover:bg-clipupp-neutral-100 " +
        (saved ? "text-clipupp-danger " : "") +
        className
      }
    >
      <Heart
        size={20}
        aria-hidden
        fill={saved ? "currentColor" : "none"}
        className={pop ? "clipupp-heart" : undefined}
      />
    </button>
  );
}
