export type HowToStep = { name: string; text: string };

/**
 * HowTo schema — drives the rich step-by-step Google snippet. Used by the
 * HowItWorksSection on the home page to surface "how to use a coupon" as
 * structured data. Steps should be short instructional sentences.
 */
export function howToSchema({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: HowToStep[];
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}
