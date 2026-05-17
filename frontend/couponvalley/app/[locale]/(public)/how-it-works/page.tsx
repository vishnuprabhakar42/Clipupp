import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MousePointer2, PiggyBank, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "How CouponValley works",
  description:
    "Find a coupon, click through, save at checkout. No browser extension needed.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  {
    icon: <Sparkles className="h-5 w-5" aria-hidden />,
    title: "Find a deal",
    body: "Search a brand, browse a category, or scan today's verified codes on the homepage.",
  },
  {
    icon: <MousePointer2 className="h-5 w-5" aria-hidden />,
    title: "Click through",
    body: "We open the merchant in a new tab with the affiliate tracker baked in. The cart price never changes for you.",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" aria-hidden />,
    title: "Apply the code",
    body: "Paste the revealed coupon code at checkout — or click straight through for our verified sale links.",
  },
  {
    icon: <PiggyBank className="h-5 w-5" aria-hidden />,
    title: "Save instantly",
    body: "The discount applies in your merchant cart right away — no waiting, no claiming. Just a lower total at checkout.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-16">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold md:text-5xl">How it works</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Four small steps to save real money. No browser extension required.
        </p>
      </header>
      <ol className="grid gap-4 md:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-md border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cv-primary to-cv-primary-strong text-white">
                {step.icon}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step {i + 1}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 rounded-md border bg-muted/30 p-8 text-center">
        <h2 className="text-xl font-semibold">Ready to start saving?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse today&apos;s top coupons or pick a category that matches what
          you&apos;re shopping for.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/coupons" className="cv-btn-primary">Browse coupons</Link>
          <Link href="/categories" className="cv-btn-ghost">By category</Link>
        </div>
      </div>
    </div>
  );
}
