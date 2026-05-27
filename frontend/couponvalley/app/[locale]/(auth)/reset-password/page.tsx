import type { Metadata } from "next";
import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your CouponValley account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
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
          <h1 className="cv-h1 mt-5 text-[1.75rem]">Set a new password</h1>
          <p className="cv-body mt-1.5 text-cv-neutral-600">
            Enter a new password for your account.
          </p>
        </div>
        <div className="rounded-lg border border-cv-neutral-200 bg-white p-6 shadow-card">
          <Suspense fallback={<p className="cv-meta">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
