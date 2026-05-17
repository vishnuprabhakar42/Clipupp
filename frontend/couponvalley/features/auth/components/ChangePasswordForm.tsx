"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersApi } from "@/lib/api/users";
import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/features/auth/schemas";

export function ChangePasswordForm() {
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordValues) {
    setSubmitting(true);
    try {
      await usersApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated. Sign in again on your other devices.");
      // Backend revokes all refresh tokens on password change. Force a fresh
      // login on this device too — refresh() will quietly fall back to anon.
      await auth.refresh();
      reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "INVALID_CURRENT_PASSWORD") {
          setError("currentPassword", { message: "Current password is incorrect" });
        } else if (err.code === "VALIDATION_FAILED") {
          for (const fe of err.problem.errors ?? []) {
            if (fe.field === "password") setError("newPassword", { message: fe.message });
          }
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Could not update password");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
          aria-invalid={!!errors.currentPassword}
        />
        {errors.currentPassword && (
          <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>
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
      <Button type="submit" disabled={submitting}>
        {submitting ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
