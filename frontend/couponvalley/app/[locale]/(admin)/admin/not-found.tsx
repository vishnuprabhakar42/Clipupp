import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-md rounded-md border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-gradient-to-br from-cv-primary to-cv-accent text-white shadow-lg">
          <Compass className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-1 text-sm text-cv-neutral-500">
          The admin page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-md bg-cv-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cv-primary-strong"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
