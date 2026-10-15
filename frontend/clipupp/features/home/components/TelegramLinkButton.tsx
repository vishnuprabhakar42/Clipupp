"use client";

import { useTranslations } from "next-intl";

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/** Opens the Telegram bot in a new tab; disabled with "Coming soon" when no bot is configured. */
export function TelegramLinkButton({ bot }: { bot: string | null }) {
  const t = useTranslations("home.alerts");
  const cls =
    "clipupp-press inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold bg-clipupp-primary text-clipupp-primary-fg";
  if (!bot) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled aria-describedby="tg-soon" className={cls + " cursor-not-allowed opacity-50"}>
          <TelegramIcon />
          {t("tgCta")}
        </button>
        <span id="tg-soon" className="text-[14px] text-clipupp-neutral-500">{t("tgSoon")}</span>
      </div>
    );
  }
  return (
    <a
      href={`https://t.me/${encodeURIComponent(bot)}?start=web`}
      target="_blank"
      rel="noopener"
      className={cls + " hover:bg-clipupp-primary-strong"}
    >
      <TelegramIcon />
      {t("tgCta")}
    </a>
  );
}
