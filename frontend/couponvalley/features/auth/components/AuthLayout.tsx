import type { ReactNode } from "react";
import { ShoppingBag, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

type Bullet = { icon?: typeof CheckCircle2; title: string; body?: string };

const DEFAULT_BULLETS: Bullet[] = [
  {
    icon: CheckCircle2,
    title: "Verified daily",
    body: "Every code is tested by our editorial team — no junk results.",
  },
  {
    icon: Sparkles,
    title: "Exclusive deals",
    body: "Members-only codes you won't find on other sites.",
  },
  {
    icon: ShieldCheck,
    title: "Free forever",
    body: "No paywall, no premium tier — just savings.",
  },
];

/**
 * Two-column auth shell (Stripe / Rakuten / Substack pattern). Form on the
 * left at a comfortable 440px reading width; editorial panel on the right
 * with three trust bullets and social-proof microcopy. On mobile (<1024px),
 * the right panel hides entirely so the form gets the full width.
 *
 * Used by sign-in / sign-up / forgot-password / reset-password / verify-email.
 * Each consumer passes a heading + subheading + the form itself; the
 * footer-microcopy (legal links) is also a child slot.
 */
export function AuthLayout({
  heading,
  subheading,
  children,
  footer,
  bullets = DEFAULT_BULLETS,
  panelHeading = "Why CouponValley",
  panelSubheading = "Trusted by 10,000+ smart shoppers.",
}: {
  heading: string;
  subheading?: string;
  children: ReactNode;
  footer?: ReactNode;
  bullets?: Bullet[];
  panelHeading?: string;
  panelSubheading?: string;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* LEFT — form column */}
      <div className="flex items-center justify-center bg-cv-neutral-50 px-4 py-10">
        <div className="w-full max-w-[440px] space-y-6">
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-bold text-cv-primary"
              aria-label="CouponValley home"
            >
              <span className="grid h-10 w-10 place-items-center rounded-md bg-cv-primary text-white">
                <ShoppingBag className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-xl">CouponValley</span>
            </Link>
            <h1 className="cv-h1 mt-5 text-[1.75rem]">{heading}</h1>
            {subheading && (
              <p className="cv-body mt-1.5 text-cv-neutral-600">{subheading}</p>
            )}
          </div>

          <div className="rounded-lg border border-cv-neutral-200 bg-white p-6 shadow-card">
            {children}
          </div>

          {footer && <div className="cv-meta text-center">{footer}</div>}
        </div>
      </div>

      {/* RIGHT — editorial panel (desktop only). Soft cv-primary-soft band so
          it reads as a hero band, not a sidebar. Pure server content; zero
          JS shipped. */}
      <aside
        aria-label="Why CouponValley"
        className="hidden flex-col justify-center bg-cv-primary-soft px-12 py-10 lg:flex"
      >
        <div className="mx-auto max-w-md">
          <p className="cv-tag bg-transparent px-0 text-cv-primary">
            {panelHeading}
          </p>
          <h2 className="cv-display-hero mt-3 text-[2rem] lg:text-[2.5rem]">
            Save more on every purchase.
          </h2>
          <p className="cv-body mt-3 text-cv-neutral-700">{panelSubheading}</p>

          <ul className="mt-8 space-y-5">
            {bullets.map((b, i) => {
              const Icon = b.icon ?? CheckCircle2;
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-cv-primary shadow-card">
                    <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="cv-h3 text-[15px]">{b.title}</p>
                    {b.body && (
                      <p className="cv-meta mt-0.5 text-cv-neutral-600">{b.body}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
