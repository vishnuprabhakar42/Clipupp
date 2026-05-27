import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join CouponValley to save coupons and get the best deals first.",
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cv-neutral-50 px-4 py-10">
      <div className="w-full max-w-[440px] space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-cv-primary"
            aria-label="CouponValley home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-md bg-cv-primary text-white">
              <ShoppingBag className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-xl">CouponValley</span>
          </Link>
          <h1 className="cv-h1 mt-5 text-[1.75rem]">Create your account</h1>
          <p className="cv-body mt-1.5 text-cv-neutral-600">
            Free — takes about a minute. Confirm your email to activate.
          </p>
        </div>

        <div className="rounded-lg border border-cv-neutral-200 bg-white p-6 shadow-card">
          <SignUpForm />
        </div>

        <p className="cv-meta text-center">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-cv-neutral-900">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-cv-neutral-900">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
