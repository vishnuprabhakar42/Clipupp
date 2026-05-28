"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usersApi } from "@/lib/api/users";
import { isApiError } from "@/lib/api/errors";
import {
  preferencesSchema,
  type PreferencesValues,
} from "@/features/auth/schemas";

export function PreferencesForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      preferredCurrency: "INR",
      emailOptIn: true,
      weeklyDigestOptIn: true,
      marketingOptIn: false,
    },
  });

  useEffect(() => {
    let alive = true;
    usersApi
      .preferences()
      .then((p) => alive && reset(p))
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [reset]);

  async function onSubmit(values: PreferencesValues) {
    setSubmitting(true);
    try {
      const next = await usersApi.updatePreferences(values);
      reset(next);
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save preferences");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading preferences…</p>;
  }

  const emailOptIn = watch("emailOptIn") ?? true;
  const weeklyDigestOptIn = watch("weeklyDigestOptIn") ?? true;
  const marketingOptIn = watch("marketingOptIn") ?? false;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1">
        <Label htmlFor="preferredCurrency">Preferred currency</Label>
        <Input
          id="preferredCurrency"
          maxLength={3}
          {...register("preferredCurrency", {
            setValueAs: (v: string | undefined) => v?.toUpperCase(),
          })}
          aria-invalid={!!errors.preferredCurrency}
        />
        {errors.preferredCurrency && (
          <p className="text-sm text-destructive">{errors.preferredCurrency.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          ISO 4217 — for example INR, USD, GBP. Used to format prices across the site.
        </p>
      </div>

      <ToggleRow
        label="Transactional emails"
        description="Verification, password resets, and other essential account messages."
        checked={emailOptIn}
        onChange={(v) => setValue("emailOptIn", v, { shouldDirty: true })}
      />
      <ToggleRow
        label="Weekly deals digest"
        description="A weekly highlight of new coupons in your top categories."
        checked={weeklyDigestOptIn}
        onChange={(v) => setValue("weeklyDigestOptIn", v, { shouldDirty: true })}
      />
      <ToggleRow
        label="Promotional emails"
        description="Occasional product news and partner offers. Off by default."
        checked={marketingOptIn}
        onChange={(v) => setValue("marketingOptIn", v, { shouldDirty: true })}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
