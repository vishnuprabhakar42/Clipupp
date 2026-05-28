import type { ReactNode } from "react";
import { CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
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
 * Two-column auth shell. Form on the left at 440px reading width; editorial
 * panel on the right with three glass trust bullets on a crimson mesh
 * background. On mobile (<1024px) the right panel hides entirely so the form
 * gets the full width.
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
  panelHeading = "Why ClipUpp",
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
              className="inline-flex items-center gap-2 text-cv-primary-700 font-display"
              aria-label="ClipUpp home"
            >
              <svg viewBox="0 0 32 32" width={36} height={36} aria-hidden>
                <path
                  d="M11 6 L11 22 A4.5 4.5 0 0 0 20 22 L20 10 A3.5 3.5 0 0 0 13 10 L13 19"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="cv-text-gradient-hero text-2xl font-extrabold tracking-tight">
                clipupp
              </span>
            </Link>
            <h1 className="cv-h1 mt-5 text-[1.75rem]">{heading}</h1>
            {subheading && (
              <p className="cv-body mt-2 text-cv-neutral-700">{subheading}</p>
            )}
          </div>

          <div className="cv-card p-6">{children}</div>

          {footer && <div className="cv-meta text-center">{footer}</div>}
        </div>
      </div>

      {/* RIGHT — editorial panel (desktop only). Crimson mesh band with two
          decorative floating circles + glass trust bullets. Pure server
          content; zero JS shipped. */}
      <aside
        aria-label="Why ClipUpp"
        className="cv-section-bg-mesh-primary relative hidden flex-col justify-center overflow-hidden px-12 py-10 lg:flex"
      >
        {/* Decorative floating circles */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full"
          style={{
            background: "rgb(var(--cv-accent-rgb) / 0.18)",
            filter: "blur(56px)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-12 h-80 w-80 rounded-full"
          style={{
            background: "rgb(255 255 255 / 0.10)",
            filter: "blur(64px)",
          }}
        />

        <div className="relative mx-auto max-w-md">
          <p className="cv-eyebrow-vivid" style={{ color: "#FFFFFF" }}>
            {panelHeading}
          </p>
          <h2 className="cv-display-hero mt-4 text-white">
            Save more on{" "}
            <span className="cv-text-gradient-savings">every</span> purchase.
          </h2>
          <p className="cv-body mt-4 text-white/85">{panelSubheading}</p>

          <ul className="mt-9 space-y-5">
            {bullets.map((b, i) => {
              const Icon = b.icon ?? CheckCircle2;
              return (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-cv-success backdrop-blur-sm"
                    style={{ background: "rgb(255 255 255 / 0.18)" }}
                  >
                    <Icon className="h-5 w-5" aria-hidden strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-extrabold text-white">
                      {b.title}
                    </p>
                    {b.body && (
                      <p className="mt-0.5 text-[13px] leading-relaxed text-white/80">
                        {b.body}
                      </p>
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
