"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Admin-only error boundary. Catches any uncaught render or data-fetch
 * error inside /admin/* and surfaces a styled retry screen instead of the
 * default Next dev/prod error UI.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[admin] route error:", error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-lg rounded-md border bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-clipupp-danger-soft">
            <AlertTriangle className="h-5 w-5 text-clipupp-danger" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-xs text-clipupp-neutral-500">
              The admin console hit an unexpected error.
            </p>
          </div>
        </div>

        <p className="mb-2 text-sm text-gray-700">{error.message || "Unknown error"}</p>
        {error.digest && (
          <p className="mb-4 font-mono text-[11px] text-clipupp-neutral-400">
            digest: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md bg-clipupp-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-clipupp-primary-strong"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-clipupp-neutral-500 hover:text-gray-700"
          >
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
