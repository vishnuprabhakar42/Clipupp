"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[public] route error", error);
    }
  }, [error]);

  return (
    <div className="clipupp-container clipupp-section">
      <div className="mx-auto max-w-xl text-center">
        <p className="clipupp-meta uppercase tracking-wider text-clipupp-danger">Something went wrong</p>
        <h1 className="clipupp-h1 mt-3">We hit a snag loading this page.</h1>
        <p className="clipupp-body mt-4 text-clipupp-neutral-600">
          This is on us. Give it another try, or head back to the homepage.
        </p>
        {error?.digest && (
          <p className="clipupp-meta mt-3 text-clipupp-neutral-500">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={reset} className="clipupp-btn-primary">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go to homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
