import { Home, LayoutGrid, Bookmark, User } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";

/**
 * Mobile bottom navigation — fixed 64px bar with four primary actions.
 * Hidden on `lg:` and above (the header handles desktop navigation).
 *
 * Active-state styling is keyed off the locale-relative href; we leave it
 * as a server component and let the layout decide which key is active by
 * passing `active`. Falls back to no active state if omitted.
 */
type MobileNavKey = "home" | "browse" | "saved" | "account";

export async function MobileBottomNav({
  active,
}: {
  active?: MobileNavKey;
} = {}) {
  const t = await getTranslations("mobileNav");
  const items: Array<{
    key: MobileNavKey;
    href: string;
    label: string;
    icon: typeof Home;
  }> = [
    { key: "home", href: "/", label: t("home"), icon: Home },
    { key: "browse", href: "/stores", label: t("browse"), icon: LayoutGrid },
    { key: "saved", href: "/account/saved-coupons", label: t("saved"), icon: Bookmark },
    { key: "account", href: "/account", label: t("account"), icon: User },
  ];

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-sticky border-t border-clipupp-neutral-200 bg-white lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-16 max-w-[600px] items-stretch justify-around">
        {items.map(({ key, href, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 border-t-2 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? "border-clipupp-primary text-clipupp-primary"
                    : "border-transparent text-clipupp-neutral-500 hover:text-clipupp-neutral-900"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
