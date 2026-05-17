import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BadgeCheck, Sparkles } from "lucide-react";
import { getServerSession } from "@/lib/auth/server";
import { accountFetch } from "@/lib/account/server-fetch";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LogOutButton } from "@/features/auth/components/LogOutButton";
import { AccountNavLink } from "@/features/savedcoupons/components/AccountNavLink";
import type { CursorPage } from "@/lib/api/types";

/**
 * Authenticated account-area layout. Includes the public Header + Footer so
 * the account pages feel like a first-class part of the site (the previous
 * version was chrome-less). Wraps content in a colourful gradient hero with
 * the user's avatar/email/role plus a vertical iconed sidebar that
 * highlights the current section.
 */
export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerSession();
  if (!user) redirect("/sign-in?next=/account");

  // Best-effort: fetch saved-coupon count for the sidebar badge. The cursor
  // API doesn't return a total — we use page count as a "has any" flag.
  const savedPage = await accountFetch<CursorPage<unknown>>(
    "/api/v1/account/saved-coupons?limit=24"
  );
  const savedCount = savedPage?.data?.length ?? 0;

  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-cv-neutral-50 via-white to-cv-neutral-50">
      <Header />

      <main id="main" className="flex-1" role="main">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{
            // Soft violet radial wash + warm orange accent in the top-right — on-brand.
            // rgba values mirror var(--cv-primary) = #5B21B6, var(--cv-accent) = #F97316.
            backgroundImage:
              "radial-gradient(80% 60% at 20% 0%, rgba(91,33,182,0.10) 0%, transparent 60%), radial-gradient(60% 60% at 100% 0%, rgba(249,115,22,0.08) 0%, transparent 70%), linear-gradient(180deg, var(--cv-primary-soft) 0%, #ffffff 80%)",
          }}
        >
          <div className="container relative py-8 md:py-12">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="grid h-16 w-16 place-items-center rounded-md bg-gradient-to-br from-cv-primary to-cv-accent text-2xl font-black text-white shadow-lg ring-4 ring-white sm:h-20 sm:w-20 sm:text-3xl">
                    {initial}
                  </span>
                  {user.emailVerified && (
                    <span
                      className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white ring-2 ring-white"
                      aria-hidden
                    >
                      <BadgeCheck className="h-5 w-5 fill-emerald-500 text-white" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                      {user.name || "Welcome back"}
                    </h1>
                    {(user.roles.includes("ADMIN") ||
                      user.roles.includes("SUPER_ADMIN")) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cv-primary to-cv-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {user.roles.includes("SUPER_ADMIN") ? "Super admin" : "Admin"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              <LogOutButton />
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="container pb-16 pt-6">
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            <nav
              aria-label="Account sections"
              className="self-start rounded-md border border-gray-100 bg-white/60 p-2 shadow-sm backdrop-blur md:sticky md:top-24"
            >
              <ul className="space-y-1">
                <li>
                  <AccountNavLink
                    href="/account"
                    iconName="overview"
                    label="Overview"
                    accent={{ bg: "bg-cv-primary-soft", text: "text-cv-primary" }}
                  />
                </li>
                <li>
                  <AccountNavLink
                    href="/account/saved-coupons"
                    iconName="saved"
                    label="Saved coupons"
                    badge={savedCount > 0 ? savedCount : null}
                    accent={{ bg: "bg-cv-accent-soft", text: "text-cv-accent" }}
                  />
                </li>
                <li>
                  <AccountNavLink
                    href="/account/profile"
                    iconName="profile"
                    label="Profile"
                    accent={{ bg: "bg-cv-primary-soft", text: "text-cv-primary" }}
                  />
                </li>
                <li>
                  <AccountNavLink
                    href="/account/preferences"
                    iconName="preferences"
                    label="Preferences"
                    accent={{ bg: "bg-cv-success-soft", text: "text-cv-success" }}
                  />
                </li>
                <li>
                  <AccountNavLink
                    href="/account/click-history"
                    iconName="history"
                    label="Click history"
                    accent={{ bg: "bg-cv-accent-soft", text: "text-cv-accent" }}
                  />
                </li>
              </ul>
            </nav>

            <div className="min-w-0">{children}</div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
