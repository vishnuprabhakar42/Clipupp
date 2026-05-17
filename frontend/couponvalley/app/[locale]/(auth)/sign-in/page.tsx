import type { Metadata } from "next";
import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { SignInForm } from "@/features/auth/components/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your CouponValley account.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand header */}
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
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to save coupons and track your savings.
          </p>
        </div>

        <div className="rounded-md border bg-card p-6 shadow-sm">
          <Suspense>
            <SignInForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
