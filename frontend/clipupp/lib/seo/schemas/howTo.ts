export type HowToStep = { name: string; text: string };

/**
 * HowTo schema - drives the rich step-by-step Google snippet for a "how to
 * use a coupon" walkthrough. Not rendered on the home page since the v2
 * redesign; kept for an info page that wants it. Steps should be short
 * instructional sentences.
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
