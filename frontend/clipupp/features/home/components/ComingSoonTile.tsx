import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { anchorFor, renderedAnchors } from "@/lib/home/anchors";
import type { HomeFeed } from "@/lib/home/feed";

/**
 * Stand-in for a deals, bank or calendar block that has no rows in production
 * (see `comingSoon` in lib/home/anchors): one full-width card with the block's
 * eyebrow and title, a one-line body and a "Get alerts" link to the alerts
 * block, hidden when alerts does not render. Keeps the block's section id so
 * the wrapper and any deep link still land on the page.
 */
export async function ComingSoonTile({
  id,
  feed,
  eyebrow,
  eyebrowTone = "brand",
  title,
  body,
}: {
  id: "deals" | "bank" | "calendar";
  feed: HomeFeed;
  eyebrow: string;
  eyebrowTone?: "brand" | "danger";
  title: string;
  body: string;
}) {
  const t = await getTranslations("home.soon");
  const alerts = anchorFor("alerts", renderedAnchors(feed));
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="clipupp-container pt-10 md:pt-14 lg:pt-[72px]">
      <div className="clipupp-reveal flex flex-col gap-4 rounded-[20px] border border-dashed border-clipupp-neutral-300 bg-clipupp-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:px-7 lg:py-6">
        <div className="min-w-0">
          <span
            className={`mb-1.5 block text-[11.5px] font-semibold uppercase leading-[1.5] tracking-[0.07em] ${eyebrowTone === "danger" ? "text-clipupp-danger" : "text-clipupp-primary"}`}
          >
            {eyebrow}
          </span>
          <h2
            id={headingId}
            className="text-balance font-display text-[length:var(--fs-h2)] font-semibold leading-[1.15] tracking-[-0.01em] text-clipupp-neutral-900"
          >
            {title}
          </h2>
          <p className="mt-1.5 text-[15px] text-clipupp-neutral-600">{body}</p>
        </div>
        {alerts && (
          <Link href={alerts} className="clipupp-btn-ghost clipupp-press shrink-0 self-start sm:self-auto">
            {t("cta")}
          </Link>
        )}
      </div>
    </section>
  );
}
