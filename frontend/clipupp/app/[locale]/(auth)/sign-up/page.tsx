import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { AuthLayout } from "@/features/auth/components/AuthLayout";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join Clipupp to save coupons and get the best deals first.",
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <AuthLayout
      heading="Create your account"
      subheading="Free — takes about a minute. Confirm your email to activate."
      footer={
        <>
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-clipupp-neutral-900">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-clipupp-neutral-900">
            Privacy Policy
          </Link>
          .
        </>
      }
    >
      <SignUpForm />
    </AuthLayout>
  );
}
