import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join CouponValley to save coupons and get the best deals first.",
};

export default function SignUpPage() {
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
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Free — takes about a minute. Confirm your email to activate.
          </p>
        </div>

        <div className="rounded-md border bg-card p-6 shadow-sm">
          <SignUpForm />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to our{" "}
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
