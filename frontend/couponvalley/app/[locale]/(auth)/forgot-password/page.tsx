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
          <h1 className="cv-h1 mt-5 text-[1.75rem]">Forgot your password?</h1>
          <p className="cv-body mt-1.5 text-cv-neutral-600">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>
        <div className="rounded-lg border border-cv-neutral-200 bg-white p-6 shadow-card">
          <Suspense>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
