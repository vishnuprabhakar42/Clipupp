import { Globe } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { useTranslations } from "next-intl";

/**
 * Slim inline marker shown above the page chrome on /hi/* routes. Tells
 * Hindi visitors the translation layer is still maturing and offers a
 * one-click switch back to English. Server-rendered, zero JS.
 *
 * Render conditionally from the locale layout (`locale === "hi"`).
 */
export function HindiBetaMarker() {
  const t = useTranslations("chrome.hindiBeta");
  return (
    <div
      role="status"
      className="border-b border-clipupp-accent/30 bg-clipupp-accent-soft text-clipupp-accent-strong"
    >
      <div className="container flex flex-col items-center justify-center gap-1.5 px-4 py-2 text-center text-[12px] sm:flex-row sm:gap-3">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Globe className="h-3.5 w-3.5" aria-hidden />
          हिन्दी संस्करण बीटा में है · Hindi is in beta
        </span>
        <span className="hidden sm:inline text-clipupp-accent/60" aria-hidden>·</span>
        <span>
          {t("placeholderNote")}{" "}
          <Link
            href="/"
            locale="en"
            className="font-semibold underline-offset-2 hover:underline"
          >
            {t("switchToEnglish")}
          </Link>
        </span>
      </div>
    </div>
  );
}
