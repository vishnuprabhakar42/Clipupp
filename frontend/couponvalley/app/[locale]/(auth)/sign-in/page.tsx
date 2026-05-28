import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { AuthLayout } from "@/features/auth/components/AuthLayout";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ClipUpp account.",
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to save coupons and track your savings."
      footer={
        <>
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline hover:text-cv-neutral-900">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-cv-neutral-900">
            Privacy Policy
          </Link>
          .
        </>
      }
    >
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  );
}
