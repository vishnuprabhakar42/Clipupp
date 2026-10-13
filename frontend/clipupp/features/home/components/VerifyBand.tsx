import { getTranslations } from "next-intl/server";
import type { HomeFeed } from "@/lib/home/feed";

/**
 * How we verify: white band, left copy with three stat tiles, right numbered
 * steps (CSS counter). Copy only promises what exists today.
 */
export async function VerifyBand({ feed }: { feed: HomeFeed }) {
  const t = await getTranslations("home.verify");
  const { verifiedToday, successRate7d } = feed.stats;
  const steps = [1, 2, 3] as const;
  const stats = [
    { value: new Intl.NumberFormat("en-IN").format(verifiedToday), label: t("statTodayLabel") },
    successRate7d == null
      ? { value: t("statDaily"), label: t("statDailyLabel") }
      : { value: `${successRate7d}%`, label: t("statRateLabel") },
    { value: t("statPullValue"), label: t("statPullLabel") },
  ];
  return (
    <section id="verify" aria-labelledby="verify-heading" className="mt-9 border-y border-clipupp-neutral-200 bg-clipupp-surface sm:mt-12 lg:mt-14">
      <div className="clipupp-container grid gap-10 py-12 lg:grid-cols-[4fr_7fr] lg:gap-16 lg:py-[72px]">
        <div className="clipupp-reveal">
          <span className="mb-1.5 block text-[11.5px] font-semibold uppercase leading-[1.5] tracking-[0.07em] text-clipupp-primary">{t("eyebrow")}</span>
          <h2 id="verify-heading" className="max-w-[16ch] text-balance font-display text-[23px] font-semibold leading-[1.15] tracking-[-0.01em] sm:text-[28px] lg:text-[32px] text-clipupp-neutral-900">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-[44ch] text-[16px] leading-normal text-clipupp-neutral-700">{t("lead")}</p>
          <dl className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col border-l-[3px] border-clipupp-primary pl-3">
                <dt className="order-2 mt-1 text-[12px] leading-tight text-clipupp-neutral-500">{s.label}</dt>
                <dd className="clipupp-num order-1 text-[24px] font-extrabold leading-none tracking-[-0.02em] text-clipupp-neutral-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ol aria-label={t("stepsAria")} className="clipupp-reveal grid content-start gap-2.5 [counter-reset:step]" style={{ "--i": 1 } as React.CSSProperties}>
          {steps.map((n) => (
            <li key={n} className="flex gap-4 rounded-2xl border border-clipupp-neutral-200 bg-clipupp-page p-4 [counter-increment:step]">
              <span
                aria-hidden
                className="clipupp-num grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clipupp-tint-100 text-[18px] font-bold text-clipupp-primary before:content-[counter(step)]"
              />
              <div>
                <b className="block text-[15px] font-semibold text-clipupp-neutral-900">{t(`step${n}Title`)}</b>
                <p className="mt-0.5 text-[14px] leading-relaxed text-clipupp-neutral-700">{t(`step${n}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
