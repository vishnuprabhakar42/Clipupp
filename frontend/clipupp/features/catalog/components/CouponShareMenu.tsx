"use client";

import { Check, Copy, Link as LinkIcon, Send, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

/**
 * Reusable "share" affordance for coupons. Tries the native share sheet first
 * (great on mobile + iOS); falls back to a per-network dropdown. Every link
 * carries a `?utm_source=clipupp_share` parameter so we can attribute
 * organic resurfacing.
 */
export function CouponShareMenu({
  url,
  title,
  iconOnly = false,
}: {
  url: string;
  title: string;
  iconOnly?: boolean;
}) {
  const t = useTranslations("catalog.ui");
  const [copied, setCopied] = useState(false);
  const shareUrl = withUtm(url);

  async function tryNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: shareUrl, title, text: title });
        return true;
      } catch {
        // user cancelled — silent
      }
    }
    return false;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      aria-label={t("shareDeal")}
      onClick={async (e) => {
        if (await tryNativeShare()) e.preventDefault();
      }}
      className={iconOnly ? "h-8 w-8" : ""}
    >
      <Share2 className="h-4 w-4" aria-hidden />
      {!iconOnly && <span className="ml-2 text-xs">{t("share")}</span>}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" aria-hidden />
            Twitter
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" aria-hidden />
            WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" aria-hidden />
            Telegram
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" aria-hidden />
            Email
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); void copy(); }} className="flex items-center gap-2">
          {copied ? (
            <Check className="h-4 w-4 text-clipupp-success" aria-hidden />
          ) : (
            <LinkIcon className="h-4 w-4" aria-hidden />
          )}
          {copied ? "Copied" : "Copy link"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); void copy(); }} className="hidden">
          <Copy className="h-4 w-4" aria-hidden />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function withUtm(url: string) {
  try {
    const u = new URL(url, "https://clipupp.com");
    if (!u.searchParams.has("utm_source")) {
      u.searchParams.set("utm_source", "clipupp_share");
    }
    return u.toString();
  } catch {
    return url;
  }
}
