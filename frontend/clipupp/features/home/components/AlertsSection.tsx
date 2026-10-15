import { getTranslations } from "next-intl/server";
import type { HomeFeed } from "@/lib/home/feed";
import { TelegramLinkButton } from "./TelegramLinkButton";
import { NewsletterForm } from "./NewsletterForm";

/** Two alert cards: Telegram daily codes and the weekly email digest. */
export async function AlertsSection({ feed }: { feed: HomeFeed }) {
  const t = await getTranslations("home.alerts");
  return (
    <section id="alerts" aria-labelledby="alerts-heading" className="clipupp-container pt-10 md:pt-14 lg:pt-[72px]">
      <h2 id="alerts-heading" className="sr-only">{t("h2")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:gap-3">
        <div className="clipupp-reveal flex flex-col rounded-[20px] border border-clipupp-neutral-200 bg-gradient-to-br from-clipupp-ok-bg to-clipupp-surface p-5 lg:p-[20px]">
          <span className="mb-1.5 block text-[11.5px] font-semibold uppercase leading-[1.5] tracking-[0.07em] text-clipupp-success">{t("tgEyebrow")}</span>
          <h3 className="mt-0.5 font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-clipupp-neutral-900">{t("tgTitle")}</h3>
          <p className="mb-3 mt-2 text-[15px] text-clipupp-neutral-700">{t("tgBody")}</p>
          <div className="mt-auto">
            <TelegramLinkButton bot={feed.telegramBot} />
          </div>
        </div>
        <div className="clipupp-reveal flex flex-col rounded-[20px] border border-clipupp-neutral-200 bg-clipupp-surface p-5 lg:p-[20px]" style={{ "--i": 1 } as React.CSSProperties}>
          <span className="mb-1.5 block text-[11.5px] font-semibold uppercase leading-[1.5] tracking-[0.07em] text-clipupp-primary">{t("mailEyebrow")}</span>
          <h3 className="mt-0.5 font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-clipupp-neutral-900">{t("mailTitle")}</h3>
          <p className="mb-3 mt-2 text-[15px] text-clipupp-neutral-700">{t("mailBody")}</p>
          <div className="mt-auto">
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
