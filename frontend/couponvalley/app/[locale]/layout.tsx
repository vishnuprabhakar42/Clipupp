import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import "../globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { GoogleOAuthProvider } from "@/components/providers/GoogleOAuthProvider";
import { getServerSession } from "@/lib/auth/server";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/lib/seo/jsonLd";
import { organizationSchema, webSiteSchema } from "@/lib/seo/schemas";
import { DeferredClientWidgets } from "@/components/site/DeferredClientWidgets";
import { HindiBetaMarker } from "@/components/site/HindiBetaMarker";
import { dirFor, localeToBcp47, locales, type Locale } from "@/lib/i18n/config";

// Typography: Apple San Francisco everywhere via the system font stack
// (see `--font-sans` in app/globals.css). No webfont network load — SF on
// Apple platforms, native fallbacks elsewhere. Tailwind's `font-sans` and
// `font-display` both resolve to this stack, so existing class usages keep
// working without modification.
//
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
      template: `%s — CouponValley`,
    },
    description: t("description"),
    metadataBase: new URL(SITE_URL),
    applicationName: "CouponValley",
    // Explicit icon links — Next 15's file-convention picker handles
    // `app/icon.svg` but not `app/apple-icon.svg` reliably (apple-icon
    // is expected to be PNG by the convention). Declare both manually
    // so the link tags definitely render.
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
    },
    appleWebApp: {
      capable: true,
      title: "CouponValley",
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
      siteName: "CouponValley",
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
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1D4ED8" },
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
    <html lang={localeToBcp47[localeTyped]} dir={dirFor(localeTyped)}>
      <head>
        {/* Preconnect to the image origins we use most so the first <Image>
            on the page doesn't pay the TCP+TLS handshake cost. */}
        <link rel="preconnect" href="https://logo.clearbit.com" />
        <link rel="preconnect" href="https://placehold.co" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
      </head>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <LanguageProvider>
            <ReactQueryProvider>
              <GoogleOAuthProvider>
              <AuthProvider initialUser={session}>
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-cv-primary focus:px-3 focus:py-2 focus:text-white"
                >
                  Skip to content
                </a>
                {locale === "hi" && <HindiBetaMarker />}
                {children}
                <DeferredClientWidgets />
              </AuthProvider>
              </GoogleOAuthProvider>
              <Toaster />
            </ReactQueryProvider>
          </LanguageProvider>
        </NextIntlClientProvider>
        <JsonLd id="ld-organization" data={organizationSchema(SITE_URL)} />
        <JsonLd id="ld-website" data={webSiteSchema(SITE_URL)} />
      </body>
    </html>
  );
}
