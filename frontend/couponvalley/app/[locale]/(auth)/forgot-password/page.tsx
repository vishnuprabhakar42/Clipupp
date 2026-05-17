import type { Metadata } from "next";
import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot your password?",
  description: "Enter your email and we'll send you a reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-cv-primary"
            aria-label="CouponValley home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-cv-primary to-cv-primary-strong text-white shadow-md">
              <ShoppingBag className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-xl">CouponValley</span>
          </Link>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>
        <div className="rounded-md border bg-card p-6 shadow-sm">
          <Suspense>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
