import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { AuthLayout } from "@/features/auth/components/AuthLayout";

export const metadata: Metadata = {
  title: "Forgot your password?",
  description: "Enter your email and we'll send you a reset link.",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      heading="Forgot your password?"
      subheading="Enter your email and we'll send you a reset link."
    >
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
