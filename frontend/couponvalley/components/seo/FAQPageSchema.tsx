import { JsonLd } from "./JsonLd";

export type FaqItem = { question: string; answer: string };

export function FAQPageSchema({ items }: { items: FaqItem[] }) {
  if (!items || items.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
  return <JsonLd id="ld-faqpage" data={data} />;
}
