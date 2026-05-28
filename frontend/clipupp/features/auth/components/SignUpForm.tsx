"use client";

import { useState } from "react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { isApiError } from "@/lib/api/errors";
import { signupSchema, type SignupValues } from "@/features/auth/schemas";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function SignUpForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setSubmitting(true);
    try {
      await authApi.register(values);
      toast.success("Account created — check your inbox to verify your email");
      router.push("/sign-in?next=/account");
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "EMAIL_TAKEN") {
          setError("email", { message: "Email is already registered" });
        } else if (err.code === "VALIDATION_FAILED") {
          for (const fe of err.problem.errors ?? []) {
            const field = fe.field as keyof SignupValues;
            if (["email", "password", "name"].includes(field)) {
              setError(field, { message: fe.message });
            }
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
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          autoComplete="name"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            12+ characters, with upper, lower, and a digit.
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </Button>
      <GoogleSignInButton label="Sign up with Google" />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
