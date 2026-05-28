import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Settings",
  robots: { index: false },
};

const AREAS: Array<{ href: string; label: string; description: string }> = [
  {
    href: "/admin/settings/brand",
    label: "Brand",
    description: "Site name, tagline, primary + accent colors, logo.",
  },
  {
    href: "/admin/settings/social",
    label: "Social",
    description: "Footer social-icon URLs (WhatsApp, Facebook, X, LinkedIn, Instagram, YouTube).",
  },
  {
    href: "/admin/settings/footer",
    label: "Footer",
    description: "Disclosure copy, commission note, marquee hashtag.",
  },
  {
    href: "/admin/settings/contact",
    label: "Contact",
    description: "Email, phone, mailing address shown in the footer + contact page.",
  },
  {
    href: "/admin/settings/newsletter",
    label: "Newsletter",
    description: "Headline, sub-headline, and CTA shown above the subscribe form.",
  },
  {
    href: "/admin/settings/seo",
    label: "SEO defaults",
    description: "Default OG image, fallback meta description, title template.",
  },
];

export default function SettingsLanding() {
  return (
    <div>
      <AdminPageHeader
        title="Site settings"
        description="Strings, colors, and links that the public site renders. Public values are exposed via /api/v1/settings/public and cached for 5 minutes."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {AREAS.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="block rounded-lg border bg-card p-4 transition hover:border-primary hover:shadow-sm"
            >
              <p className="text-base font-semibold">{a.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
