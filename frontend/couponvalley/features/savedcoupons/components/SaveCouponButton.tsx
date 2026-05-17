"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { savedCouponsApi } from "@/lib/api/savedCoupons";
import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthProvider";

type Props = {
  couponId: string;
  initialSaved?: boolean;
  /** Compact icon-only mode for use inside cards. */
  iconOnly?: boolean;
  className?: string;
};

export function SaveCouponButton({
  couponId,
  initialSaved = false,
  iconOnly = false,
  className,
}: Props) {
  const router = useRouter();
  const auth = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    if (!auth.user) {
      const next = typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/";
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }

    // Optimistic flip.
    const target = !saved;
    setSaved(target);
    setBusy(true);
    try {
      if (target) await savedCouponsApi.save(couponId);
      else await savedCouponsApi.unsave(couponId);
      toast.success(target ? "Saved" : "Removed from saved");
    } catch (err) {
      // Rollback.
      setSaved(!target);
      toast.error(
        isApiError(err) ? err.message : "Could not update saved coupons"
      );
    } finally {
      setBusy(false);
    }
  }

  const Icon = saved ? BookmarkCheck : Bookmark;
  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={busy}
        aria-label={saved ? "Remove from saved" : "Save coupon"}
        aria-pressed={saved}
        className={className}
      >
        <Icon className={"h-4 w-4 " + (saved ? "fill-[var(--cv-primary)] text-cv-primary" : "")} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      className={className}
    >
      <Icon className={"mr-2 h-4 w-4 " + (saved ? "fill-current" : "")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
