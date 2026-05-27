import { Globe } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

/**
 * Slim inline marker shown above the page chrome on /hi/* routes. Tells
 * Hindi visitors the translation layer is still maturing and offers a
 * one-click switch back to English. Server-rendered, zero JS.
 *
 * Render conditionally from the locale layout (`locale === "hi"`).
 */
export function HindiBetaMarker() {
  return (
    <div
      role="status"
      className="border-b border-cv-accent/30 bg-cv-accent-soft text-cv-accent-strong"
    >
      <div className="container flex flex-col items-center justify-center gap-1.5 px-4 py-2 text-center text-[12px] sm:flex-row sm:gap-3">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Globe className="h-3.5 w-3.5" aria-hidden />
          हिन्दी संस्करण बीटा में है — Hindi is in beta
        </span>
        <span className="hidden sm:inline text-cv-accent/60" aria-hidden>·</span>
        <span>
          Some pages may show English placeholder text.{" "}
          <Link
            href="/"
            locale="en"
            className="font-semibold underline-offset-2 hover:underline"
          >
            Switch to English
          </Link>
        </span>
      </div>
    </div>
  );
}
