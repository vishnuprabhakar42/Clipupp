"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function CouponReveal({
  code,
  couponId,
}: {
  code: string;
  couponId: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        toast.success(`Copied ${code}`);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => toast.error("Could not copy to clipboard")
    );
  }

  function openMerchant() {
    window.open(`${API_BASE}/r/${couponId}`, "_blank", "noopener,noreferrer");
  }

  if (!revealed) {
    return (
      <Button
        size="lg"
        className="w-full bg-cv-primary hover:bg-cv-primary-strong"
        onClick={() => {
          setRevealed(true);
          openMerchant();
        }}
      >
        Reveal code &amp; visit store
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center justify-between rounded-md border-2 border-dashed border-cv-primary bg-background px-4 py-3">
        <code className="text-base font-semibold tracking-wider">{code}</code>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <Button
        variant="outline"
        onClick={openMerchant}
        className="sm:w-auto"
      >
        Visit merchant
        <ExternalLink className="ml-2 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
