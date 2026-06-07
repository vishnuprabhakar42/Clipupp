import { Link } from "@/lib/i18n/navigation";
import { Logo } from "@/components/site/Logo";
import {
  Facebook,
  Headphones,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  Twitter,
  Youtube,
} from "lucide-react";
import { storesApi } from "@/lib/api/stores";
import { categoriesApi } from "@/lib/api/categories";
import { getPublicSettings, asString } from "@/lib/api/settings";

/**
 * Server-rendered footer. Pulls the dark-themed multi-column layout from a
 * mix of:
 *
 *   • /api/v1/settings/public  → tagline, social URLs, contact info, copy
 *   • /api/v1/stores           → top 6 store links
 *   • /api/v1/categories       → top 6 category links
 *
 * All three fetches run in parallel; failures degrade gracefully (skeleton
 * lists / muted defaults) so the footer never blocks the page render.
 */
export async function Footer() {
  const [settings, storesPage, categoryTree] = await Promise.all([
    getPublicSettings(),
    storesApi.list({ limit: 10 }).catch(() => null),
    categoriesApi.tree().catch(() => null),
  ]);

  const tagline = asString(
    settings["brand.tagline"],
    "Striving towards making the world a better place to shop with great savings!"
  );
  const brandName = asString(settings["brand.name"], "Clipupp");
  const accent = asString(settings["brand.accent_color"], "#F97316");
  const commissionNote = asString(
    settings["footer.commission_note"],
    "We may earn a commission if you buy through links on Clipupp."
  );
  const disclosure = asString(
    settings["footer.disclosure"],
    "Clipupp earns a commission when you click out to a merchant and complete a purchase. This costs you nothing extra."
  );
  const hashtag = asString(settings["footer.hashtag"], "#SaveWithClipupp");

  const social = {
    whatsapp: asString(settings["social.whatsapp"]),
    facebook: asString(settings["social.facebook"]),
    x: asString(settings["social.x"]),
    linkedin: asString(settings["social.linkedin"]),
    instagram: asString(settings["social.instagram"]),
    youtube: asString(settings["social.youtube"]),
  };

  const contactEmail = asString(settings["contact.email"]);
  const contactPhone = asString(settings["contact.phone"]);
  const addressLines = [
    asString(settings["contact.address_line1"]),
    asString(settings["contact.address_line2"]),
    asString(settings["contact.address_line3"]),
  ].filter(Boolean);

  // Bumped 6 → 10 in Phase 4 — more internal links for crawler weight,
  // higher chance a visitor finds the brand they were looking for from
  // any page on the site.
  const stores = storesPage?.data?.slice(0, 10) ?? [];
  const categories = categoryTree?.slice(0, 10) ?? [];

  return (
    <footer className="bg-clipupp-neutral-900 text-gray-300" role="contentinfo">
      {/* ── Main grid: brand + columns ── */}
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.2fr]">
        {/* ── Brand block ── */}
        <div>
          <Logo variant="white" height={56} priority={false} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-clipupp-neutral-400">{tagline}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {social.whatsapp && (
              <SocialLink href={social.whatsapp} label="WhatsApp" color="#25D366">
                <MessageCircle className="h-4 w-4" />
              </SocialLink>
            )}
            {social.facebook && (
              <SocialLink href={social.facebook} label="Facebook" color="#1877F2">
                <Facebook className="h-4 w-4" />
              </SocialLink>
            )}
            {social.x && (
              <SocialLink href={social.x} label="X" color="#000">
                <Twitter className="h-4 w-4" />
              </SocialLink>
            )}
            {social.linkedin && (
              <SocialLink href={social.linkedin} label="LinkedIn" color="#0A66C2">
                <Linkedin className="h-4 w-4" />
              </SocialLink>
            )}
            {social.instagram && (
              <SocialLink href={social.instagram} label="Instagram" color="#E4405F">
                <Instagram className="h-4 w-4" />
              </SocialLink>
            )}
            {social.youtube && (
              <SocialLink href={social.youtube} label="YouTube" color="#FF0000">
                <Youtube className="h-4 w-4" />
              </SocialLink>
            )}
          </div>

          <p className="mt-6 max-w-xs text-xs leading-relaxed text-clipupp-neutral-500">
            {commissionNote}{" "}
            <Link href="/terms" className="hover:underline" style={{ color: accent }}>
              terms of use
            </Link>
            .
          </p>
        </div>

        {/* ── Top stores ── */}
        <FooterColumn title="Top Stores" accent={accent}>
          {stores.length === 0 ? (
            <SkeletonLinks count={6} />
          ) : (
            stores.map((s) => (
              <FooterLink key={s.id} href={`/stores/${s.slug}`}>
                {s.name}
              </FooterLink>
            ))
          )}
          <li className="pt-1">
            <Link href="/stores" className="text-xs font-semibold hover:underline" style={{ color: accent }}>
              See all stores →
            </Link>
          </li>
        </FooterColumn>

        {/* ── Top categories ── */}
        <FooterColumn title="Top Offers" accent={accent}>
          {categories.length === 0 ? (
            <SkeletonLinks count={6} />
          ) : (
            categories.map((c) => (
              <FooterLink key={c.id} href={`/categories/${c.slug}`}>
                {c.title}
              </FooterLink>
            ))
          )}
          <li className="pt-1">
            <Link
              href="/categories"
              className="text-xs font-semibold hover:underline"
              style={{ color: accent }}
            >
              See all categories →
            </Link>
          </li>
        </FooterColumn>

        {/* ── Company column ── */}
        <FooterColumn title="Company" accent={accent}>
          <FooterLink href="/about">About Us</FooterLink>
          <FooterLink href="/how-it-works">How it works</FooterLink>
          <FooterLink href="/blog">Blog</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/affiliate-disclosure">Affiliate Disclosure</FooterLink>
          <FooterLink href="/privacy">Privacy Policy</FooterLink>
          <FooterLink href="/terms">Terms of Service</FooterLink>
        </FooterColumn>

        {/* ── Contact column ── */}
        <div>
          <h3 className="mb-4 text-base font-semibold" style={{ color: accent }}>
            Contact Us
            <span
              className="ml-1 inline-block h-0.5 w-8 align-middle"
              style={{ backgroundColor: `${accent}99` }}
              aria-hidden
            />
          </h3>
          <ul className="space-y-3 text-sm">
            {contactEmail && (
              <li className="flex items-start gap-2 text-gray-300">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-clipupp-neutral-500" aria-hidden />
                <a href={`mailto:${contactEmail}`} className="hover:opacity-80">
                  {contactEmail}
                </a>
              </li>
            )}
            {contactPhone && (
              <li className="flex items-start gap-2 text-gray-300">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-clipupp-neutral-500" aria-hidden />
                <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="hover:opacity-80">
                  {contactPhone}
                </a>
              </li>
            )}
            {addressLines.length > 0 && (
              <li className="flex items-start gap-2 text-gray-300">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clipupp-neutral-500" aria-hidden />
                <span>
                  {addressLines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < addressLines.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </li>
            )}
          </ul>
          <Link
            href="/contact"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-clipupp-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-clipupp-primary-strong"
          >
            <Headphones className="h-4 w-4" aria-hidden />
            Contact Us
          </Link>
        </div>
      </div>

      {/* ── Affiliate disclosure ── */}
      <div className="border-t border-white/10 bg-clipupp-neutral-900">
        <div className="container py-5 text-xs leading-relaxed text-clipupp-neutral-500">
          <p>
            <strong className="text-gray-300">Affiliate disclosure:</strong> {disclosure}{" "}
            <Link href="/affiliate-disclosure" className="hover:underline" style={{ color: accent }}>
              Read the full disclosure
            </Link>
            .
          </p>
        </div>
      </div>

      {/* ── Bottom hashtag bar ── */}
      <div className="border-t border-white/10">
        <div className="container py-7 text-center">
          <p
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: accent }}
          >
            {hashtag}
          </p>
        </div>
      </div>

      {/* ── Copyright strip ── */}
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-4 text-xs text-clipupp-neutral-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </span>
          <span className="flex items-center gap-4">
            <Link href="/privacy" className="hover:opacity-80">Privacy</Link>
            <Link href="/terms" className="hover:opacity-80">Terms</Link>
            <Link href="/cookie-policy" className="hover:opacity-80">Cookies</Link>
            <Link href="/sitemap.xml" className="hover:opacity-80">Sitemap</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div>
      <h3 className="mb-4 text-base font-semibold" style={{ color: accent }}>
        {title}
        <span
          className="ml-1 inline-block h-0.5 w-8 align-middle"
          style={{ backgroundColor: `${accent}99` }}
          aria-hidden
        />
      </h3>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-gray-300 transition hover:opacity-80">
        {children}
      </Link>
    </li>
  );
}

function SkeletonLinks({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <span className="block h-4 w-3/4 animate-pulse rounded bg-white/10" />
        </li>
      ))}
    </>
  );
}

function SocialLink({
  href,
  label,
  color,
  children,
}: {
  href: string;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-clipupp-neutral-300 transition-colors hover:text-white"
      style={{ ["--social-hover-bg" as never]: color }}
    >
      {children}
    </a>
  );
}
