"use client";

import { useState } from "react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { isApiError } from "@/lib/api/errors";
import { resetSchema, type ResetValues } from "@/features/auth/schemas";

export function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  if (!token) {
    return (
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold">Reset link is invalid</h2>
        <p className="text-sm text-muted-foreground">
          The reset link is missing or malformed. Request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-foreground hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(values: ResetValues) {
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, values.newPassword);
      toast.success("Password updated. Sign in with your new password.");
      router.push("/sign-in");
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "TOKEN_INVALID" || err.code === "TOKEN_EXPIRED") {
          toast.error("This reset link is no longer valid. Request a new one.");
          router.push("/forgot-password");
        } else if (err.code === "VALIDATION_FAILED") {
          for (const fe of err.problem.errors ?? []) {
            if (fe.field === "password") setError("newPassword", { message: fe.message });
          }
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Could not reach the server. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
          aria-invalid={!!errors.newPassword}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
