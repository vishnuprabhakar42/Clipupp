import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BadgeCheck, Sparkles } from "lucide-react";
import { getServerSession } from "@/lib/auth/server";
import { accountFetch } from "@/lib/account/server-fetch";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { LogOutButton } from "@/features/auth/components/LogOutButton";
import { AccountNavLink } from "@/features/savedcoupons/components/AccountNavLink";
import type { CursorPage } from "@/lib/api/types";

/**
 * Authenticated account-area layout. Includes the public Header + Footer +
 * MobileBottomNav so the account pages feel like a first-class part of the
 * site. Flat neutral chrome — no decorative gradients. The hero is a flat
 * neutral-50 surface; the active nav link uses a 2px primary indicator.
 */
export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerSession();
  if (!user) redirect("/sign-in?next=/account");

  const savedPage = await accountFetch<CursorPage<unknown>>(
    "/api/v1/account/saved-coupons?limit=24"
  );
  const savedCount = savedPage?.data?.length ?? 0;

  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-clipupp-neutral-50">
      <Header />

      <main id="main" className="flex-1 pb-16 lg:pb-0" role="main">
        {/* Hero — flat neutral background, no gradient. */}
        <section className="border-b border-clipupp-neutral-200 bg-white">
          <div className="clipupp-container py-8 md:py-10">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-clipupp-primary text-2xl font-bold text-white sm:h-20 sm:w-20 sm:text-3xl">
                    {initial}
                  </span>
                  {user.emailVerified && (
                    <span
                      className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white ring-2 ring-white"
                      aria-hidden
                    >
                      <BadgeCheck className="h-5 w-5 fill-clipupp-success text-white" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="clipupp-h1 text-[1.75rem] sm:text-[2rem]">
                      {user.name || "Welcome back"}
                    </h1>
                    {(user.roles.includes("ADMIN") ||
                      user.roles.includes("SUPER_ADMIN")) && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-clipupp-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-primary-strong">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {user.roles.includes("SUPER_ADMIN") ? "Super admin" : "Admin"}
                      </span>
                    )}
                  </div>
                  <p className="clipupp-meta">{user.email}</p>
                </div>
              </div>

              <LogOutButton />
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="clipupp-container pb-16 pt-6">
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            <nav
              aria-label="Account sections"
              className="self-start rounded-lg border border-clipupp-neutral-200 bg-white p-2 shadow-card md:sticky md:top-24"
            >
              <ul className="space-y-1">
                <li>
                  <AccountNavLink
                    href="/account"
                    iconName="overview"
                    label="Overview"
                    accent={{ bg: "bg-clipupp-primary-soft", text: "text-clipupp-primary" }}
                  />
                </li>
                <li>
                  <AccountNavLink
                    href="/account/saved-coupons"
                    iconName="saved"
                    label="Saved coupons"
                    badge={savedCount > 0 ? savedCount : null}
                    accent={{ bg: "bg-clipupp-accent-soft", text: "text-clipupp-accent" }}
                  />
                </li>
                <li>
                  <AccountNavLink
                    href="/account/profile"
                    iconName="profile"
                    label="Profile"
                    accent={{ bg: "bg-clipupp-primary-soft", text: "text-clipupp-primary" }}
                  />
                </li>
                <li>
                  <AccountNavLink
                    href="/account/preferences"
                    iconName="preferences"
                    label="Preferences"
                    accent={{ bg: "bg-clipupp-success-soft", text: "text-clipupp-success" }}
                  />
                </li>
                <li>
                  <AccountNavLink
                    href="/account/click-history"
                    iconName="history"
                    label="Click history"
                    accent={{ bg: "bg-clipupp-accent-soft", text: "text-clipupp-accent" }}
                  />
                </li>
              </ul>
            </nav>

            <div className="min-w-0">{children}</div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
