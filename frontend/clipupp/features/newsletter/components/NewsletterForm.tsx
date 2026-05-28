"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsletterApi } from "@/lib/api/newsletter";
import { isApiError } from "@/lib/api/errors";

export function NewsletterForm({ className }: { className?: string }) {
  const tLegacy = useTranslations("legacy");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !email.trim()) return;
    setSubmitting(true);
    try {
      await newsletterApi.subscribe(email.trim(), locale);
      setSubmitted(true);
      setEmail("");
      toast.success("Almost there — check your inbox to confirm.");
    } catch (err) {
      // Backend always 202s legitimate inputs. A real error reaches here only
      // on validation failure or network outage.
      toast.error(
        isApiError(err) ? err.message : "Could not subscribe. Try again later."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a confirmation link. Click it to start receiving Clipupp
          deals.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="flex w-full max-w-md gap-2">
        <Input
          type="email"
          required
          placeholder={tLegacy("emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={submitting}
          aria-label={tLegacy("emailPlaceholder")}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "…" : tLegacy("subscribe")}
        </Button>
      </div>
    </form>
  );
}
