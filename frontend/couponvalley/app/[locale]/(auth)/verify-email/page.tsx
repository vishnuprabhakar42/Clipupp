import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailRunner } from "@/features/auth/components/VerifyEmailRunner";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Confirm your ClipUpp email address.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Verifying email</h1>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <VerifyEmailRunner />
        </Suspense>
      </div>
    </div>
  );
}
