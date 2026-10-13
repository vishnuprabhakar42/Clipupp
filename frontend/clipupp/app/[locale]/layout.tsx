import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { Inter, Zilla_Slab } from "next/font/google";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import "../globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GoogleOAuthProvider } from "@/components/providers/GoogleOAuthProvider";
import { getServerSession } from "@/lib/auth/server";
import { ToasterHost } from "@/components/site/ToasterHost";
import { JsonLd } from "@/lib/seo/jsonLd";
import { organizationSchema, webSiteSchema } from "@/lib/seo/schemas";
import { DeferredClientWidgets } from "@/components/site/DeferredClientWidgets";
import { CouponSheetProvider } from "@/features/catalog/components/CouponSheetProvider";
import { HindiBetaMarker } from "@/components/site/HindiBetaMarker";
import { dirFor, localeToBcp47, locales, type Locale } from "@/lib/i18n/config";

// Typography: Inter (body/UI) + Zilla Slab (display, slab-serif headings)
// loaded via next/font: self-hosted woff2 with a preload link tag. The
// `variable` option exposes each as a CSS custom property the design system
// (app/globals.css) reaches for via `--font-sans` and `--font-display`.
// Zilla Slab ships only the 600/700 latin faces every display user needs, and
// uses display "optional" so a slow font never swaps in late and shifts the
// headline (the fallback holds for that visit, the font is cached for the next).
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap", preload: true });
const zillaSlab = Zilla_Slab({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "optional", preload: true });

// CookieBanner, FirstVisitModal, and WebVitalsReporter are lazy-loaded in
// DeferredClientWidgets (client component) so they don't ship in the initial
// SSR HTML and hydrate after first paint.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.homepage" });
  return {
    title: {
      default: t("title"),
      template: "%s | Clipupp",
    },
    description: t("description"),
    metadataBase: new URL(SITE_URL),
    applicationName: "Clipupp",
    // Explicit icon links — Next 15's file-convention picker handles
    // `app/icon.svg` but not `app/apple-icon.svg` reliably (apple-icon
    // is expected to be PNG by the convention). Declare both manually
    // so the link tags definitely render.
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      title: "Clipupp",
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },
    alternates: {
      canonical: locale === "en" ? "/" : `/${locale}`,
      languages: {
        en: "/",
        hi: "/hi",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      siteName: "Clipupp",
      locale: localeToBcp47[locale as Locale] ?? "en",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
    // Phase 5 — flag Hindi pages as beta in metadata so monitoring tools and
    // (eventually) translation QA pipelines can pick them out. Custom meta
    // names are emitted as <meta name="..."> tags by Next.
    other:
      locale === "hi"
        ? { "x-translation-status": "beta" }
        : undefined,
  };
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8529CD" },
    { media: "(prefers-color-scheme: dark)", color: "#7119B8" },
  ],
  colorScheme: "light" as const,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const session = await getServerSession();
  const localeTyped = locale as Locale;

  return (
    <html
      suppressHydrationWarning
      lang={localeToBcp47[localeTyped]}
      dir={dirFor(localeTyped)}
      className={`${inter.variable} ${zillaSlab.variable}`}
    >
      <head>
        {/* Marks the document as JS-capable before first paint. The scroll
            reveal hides content only under html.js, so without JavaScript
            everything stays visible. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* Preconnect to the image origins we use most so the first <Image>
            on the page doesn't pay the TCP+TLS handshake cost. */}
        <link rel="preconnect" href="https://logo.clearbit.com" />
        <link rel="preconnect" href="https://placehold.co" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_MEDIA_ORIGIN ?? "https://pub-e786049ca02d4c5fab01494fd6012521.r2.dev"} crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
      </head>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <LanguageProvider>
              <GoogleOAuthProvider>
                <AuthProvider initialUser={session}>
                  <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-clipupp-primary focus:px-3 focus:py-2 focus:text-white"
                  >
                    Skip to content
                  </a>
                  {locale === "hi" && <HindiBetaMarker />}
                  {children}
                  {/* The one coupon sheet: every route that can open it (public, account) shares it. */}
                  <CouponSheetProvider />
                  <DeferredClientWidgets />
                </AuthProvider>
              </GoogleOAuthProvider>
              <ToasterHost />
            </LanguageProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <JsonLd id="ld-organization" data={organizationSchema(SITE_URL)} />
        <JsonLd id="ld-website" data={webSiteSchema(SITE_URL)} />
      </body>
    </html>
  );
}
