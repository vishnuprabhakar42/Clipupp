import { getTranslations } from "next-intl/server";
import { MousePointerClick, Search, Tag } from "lucide-react";

/**
 * 3-step explainer. Clean, restrained cards in the Stripe / Linear /
 * Vercel mould — no decorative noise, just a numbered chip + icon +
 * title + description. Equal heights via `flex-col` so the row stays
 * level regardless of how many lines the description wraps to.
 *
 * Server component — zero JS shipped to the browser.
 */
export async function HowItWorksSection() {
  const t = await getTranslations("home.howItWorks");
  const steps = [
    { icon: Search,            number: "01", title: t("step1.title"), description: t("step1.description") },
    { icon: MousePointerClick, number: "02", title: t("step2.title"), description: t("step2.description") },
    { icon: Tag,               number: "03", title: t("step3.title"), description: t("step3.description") },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-cv-neutral-50">
      <div className="cv-container cv-section">
        {/* Section header — eyebrow / title / subtitle */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="cv-tag bg-transparent px-0 text-cv-primary">How it works</p>
          <h2 className="cv-h2 mt-3">{t("title")}</h2>
          <p className="cv-body mx-auto mt-3 max-w-md text-cv-neutral-600">
            {t("subtitle")}
          </p>
        </div>

        {/* Steps — equal-height cards in a 3-up grid */}
        <ol className="mx-auto mt-10 grid max-w-5xl grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex h-full flex-col rounded-lg border border-cv-neutral-200 bg-white p-5 shadow-card"
              >
                {/* Top row — icon tile + tiny step counter */}
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-cv-primary text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="cv-tag bg-transparent px-0 text-cv-neutral-300">
                    {step.number}
                  </span>
                </div>

                {/* Title + description */}
                <h3 className="cv-h3 mt-5">{step.title}</h3>
                <p className="cv-body mt-1.5 text-cv-neutral-600">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
