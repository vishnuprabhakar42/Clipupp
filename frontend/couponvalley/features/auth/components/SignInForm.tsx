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
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { useAuth } from "@/lib/auth/AuthProvider";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/account";
  const auth = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const res = await authApi.login(values);
      auth.setUser(res.user);
      toast.success("Signed in");
      router.push(next);
      router.refresh();
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "UNAUTHORIZED") {
          setError("password", { message: "Invalid email or password" });
        } else if (err.code === "ACCOUNT_LOCKED") {
          toast.error("Account temporarily locked. Try again in 15 minutes.");
        } else if (err.code === "PASSWORD_NOT_SET") {
          toast.error("This account uses social sign-in. Use Continue with Google.");
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
      <GoogleSignInButton label="Sign in with Google" />
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/sign-up" className="text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
