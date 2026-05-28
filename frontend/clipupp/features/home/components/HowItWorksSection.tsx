import { getTranslations } from "next-intl/server";
import { MousePointerClick, Search, Tag } from "lucide-react";
import { JsonLd } from "@/lib/seo/jsonLd";
import { howToSchema } from "@/lib/seo/schemas";

/**
 * 3-step explainer with gradient numbered discs and a dashed gradient
 * connector line linking the steps on desktop. Equal heights via `flex-col`
 * so the row stays level regardless of how many lines the description wraps.
 *
 * Server component — zero JS shipped to the browser.
 */
export async function HowItWorksSection() {
  const t = await getTranslations("home.howItWorks");
  const steps = [
    {
      icon: Search,
      number: "01",
      title: t("step1.title"),
      description: t("step1.description"),
    },
    {
      icon: MousePointerClick,
      number: "02",
      title: t("step2.title"),
      description: t("step2.description"),
    },
    {
      icon: Tag,
      number: "03",
      title: t("step3.title"),
      description: t("step3.description"),
    },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-24">
      <JsonLd
        id="ld-howto"
        data={howToSchema({
          name: t("title"),
          description: t("subtitle"),
          steps: steps.map((s) => ({ name: s.title, text: s.description })),
        })}
      />
      <div className="clipupp-container clipupp-section">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="clipupp-eyebrow-vivid mx-auto">{t("title")}</h2>
          <p className="clipupp-body mx-auto mt-3 max-w-md text-clipupp-neutral-700">
            {t("subtitle")}
          </p>
        </div>

        {/* Steps + connector (dashed gradient line on desktop, behind discs). */}
        <ol className="relative mx-auto mt-12 grid max-w-5xl grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-5">
          {/* Dashed gradient connector — desktop only, behind cards. */}
          <span
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-0 border-t-2 border-dashed border-clipupp-primary/30 md:block"
            style={{ zIndex: 0 }}
          />
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="clipupp-card relative z-[1] flex h-full flex-col gap-3 p-6 pt-4 text-center"
              >
                <span
                  className="mx-auto -mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-clipupp-primary-soft text-clipupp-primary"
                  aria-hidden
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="clipupp-eyebrow-vivid mx-auto !pr-0 !after:hidden">
                  Step {step.number}
                </span>
                <h3 className="clipupp-h3">{step.title}</h3>
                <p className="clipupp-body text-clipupp-neutral-700">
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
