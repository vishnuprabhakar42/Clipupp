"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, X } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { bannersApi, type BannerDetail } from "@/lib/api/banners";
import { campaignsApi, type CampaignDetail } from "@/lib/api/campaigns";

const STORAGE_KEY = "cv:announcement-dismissed";

type Resolved = {
  id: string;            // unique key for dismiss state
  title: string;
  subtitle?: string | null;
  linkUrl?: string | null;
  themeColor?: string | null;
};

/**
 * Slim dismissible announcement bar above the header. An active campaign
 * (window-bound, with a hero/cta defined) takes precedence over the
 * banner-driven default. State persists in localStorage keyed by id so a
 * new announcement / campaign re-shows itself.
 */
export function AnnouncementBar() {
  const campaign = useQuery({
    queryKey: ["campaigns", "active"],
    queryFn: () => campaignsApi.getActive(),
    staleTime: 60_000,
  });

  const banners = useQuery({
    queryKey: ["banners", "top-bar"],
    queryFn: () => bannersApi.list({ placement: "TOP_BAR" }),
    staleTime: 5 * 60_000,
    enabled: !campaign.isLoading && !campaign.data,
  });

  const resolved: Resolved | null = (() => {
    const c: CampaignDetail | null = campaign.data ?? null;
    if (c && (c.heroTitle || c.ctaLabel)) {
      return {
        id: `campaign:${c.id}`,
        title: c.heroTitle ?? c.name,
        subtitle: c.ctaLabel,
        linkUrl: c.ctaUrl,
        themeColor: c.themeColor,
      };
    }
    const b: BannerDetail | undefined = banners.data?.[0];
    if (b) {
      return {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        linkUrl: b.linkUrl,
      };
    }
    return null;
  })();

  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null);
  }, []);

  if (!resolved) return null;
  if (dismissed === resolved.id) return null;

  function dismiss() {
    if (!resolved) return;
    localStorage.setItem(STORAGE_KEY, resolved.id);
    setDismissed(resolved.id);
  }

  // Theme: campaign theme color tints the gradient; otherwise default purple.
  const accent = resolved.themeColor ?? "var(--cv-primary)";
  const dark = darken(accent);

  return (
    <div
      className="relative text-white"
      style={{
        background: `linear-gradient(90deg, ${dark} 0%, ${accent} 50%, ${dark} 100%)`,
      }}
    >
      <div className="container flex items-center justify-center gap-4 px-12 py-2.5 text-center text-sm">
        <p className="line-clamp-1 text-white">
          <span className="font-medium">{resolved.title}</span>
          {resolved.subtitle && (
            <>
              {" "}
              <span className="mx-2 text-white/50">|</span>
              {resolved.linkUrl ? (
                <Link
                  href={resolved.linkUrl}
                  className="inline-flex items-center gap-1 font-semibold text-cv-accent underline-offset-2 hover:underline"
                >
                  {resolved.subtitle}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : (
                <span className="font-semibold text-cv-accent">{resolved.subtitle}</span>
              )}
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Quick darken (mix toward black 35%) for the gradient stops. */
function darken(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#3B1576";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (n: number) => Math.max(0, Math.round(n * 0.65)).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}
