import type { Metadata } from "next";
import Link from "next/link";
import { InfoPageShell } from "@/features/site/components/InfoPageShell";

export const metadata: Metadata = {
  title: "About Clipupp",
  description:
    "Clipupp is a verified coupon aggregator built for shoppers who want real savings without the spam.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPageShell
      title="About Clipupp"
      intro="A small team of engineers and shopaholics on a mission to make every checkout cheaper — without spammy popups or fake codes."
    >
      <h2 id="what-we-do">What we do</h2>
      <p>
        We aggregate, verify, and rank coupon codes and exclusive deals from
        over 1,000 merchants. Every code is human-verified before it lands on
        the homepage; expired codes are auto-pruned daily.
      </p>
      <h2 id="how-we-make-money">How we make money</h2>
      <p>
        When a shopper clicks through one of our affiliate links and completes a
        purchase, the merchant pays us a commission. The shopper pays nothing
        extra. None of our editorial ranking is influenced by commission rate.
      </p>
      <h2 id="contact">Contact</h2>
      <p>
        For partnership inquiries: <a href="mailto:partners@clipupp.com">partners@clipupp.com</a>.
        For everything else: <Link href="/contact">/contact</Link>.
      </p>
    </InfoPageShell>
  );
}
