import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  Sparkles,
  Store as StoreIcon,
  TicketPercent,
  Users,
} from "lucide-react";
import { getServerSession } from "@/lib/auth/server";
import { LogOutButton } from "@/features/auth/components/LogOutButton";
import {
  AdminNavLink,
  type AdminNavIconName,
} from "@/features/admin/components/AdminNavLink";

type NavItem = {
  href: string;
  label: string;
  iconName: AdminNavIconName;
  iconBg: string;
  iconColor: string;
  group?: string;
};

// Note: pass icon as a string `iconName` — the icon component itself can't
// cross the Server → Client component boundary (it's a forwardRef object).
// AdminNavLink resolves the string against its internal icon registry.
const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", iconName: "dashboard",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary" },

  { href: "/admin/homepage", label: "Homepage layout", iconName: "homepage",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Site" },
  { href: "/admin/banners", label: "Banners", iconName: "banners",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Site" },
  { href: "/admin/campaigns", label: "Campaigns", iconName: "campaigns",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Site" },
  { href: "/admin/settings", label: "Settings", iconName: "settings",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Site" },

  { href: "/admin/stores", label: "Stores", iconName: "stores",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Catalog" },
  { href: "/admin/coupons", label: "Coupons", iconName: "coupons",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Catalog" },
  { href: "/admin/coupons/import", label: "Import CSV", iconName: "upload",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary-strong", group: "Catalog" },
  { href: "/admin/categories", label: "Categories", iconName: "categories",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Catalog" },

  { href: "/admin/blog", label: "Blog", iconName: "blog",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Content" },
  { href: "/admin/blog/authors", label: "Authors", iconName: "authors",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Content" },
  { href: "/admin/legal-pages", label: "Legal pages", iconName: "legal",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Content" },

  { href: "/admin/networks", label: "Networks", iconName: "networks",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Affiliates" },
  { href: "/admin/merchant-links", label: "Merchant links", iconName: "merchant-links",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Affiliates" },
  { href: "/admin/clicks", label: "Click stream", iconName: "clicks",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Affiliates" },
  { href: "/admin/conversions", label: "Conversions", iconName: "conversions",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "Affiliates" },

  { href: "/admin/users", label: "Users & roles", iconName: "users",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "People" },
  { href: "/admin/newsletter", label: "Newsletter", iconName: "newsletter",
    iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", group: "People" },
];

const GROUP_ACCENTS: Record<string, string> = {
  Site: "from-cv-primary to-cv-primary-strong",
  Catalog: "from-cv-primary to-cv-primary-strong",
  Content: "from-cv-primary to-cv-primary-strong",
  Affiliates: "from-cv-primary to-cv-primary-strong",
  People: "from-cv-primary to-cv-primary-strong",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (!user) redirect("/sign-in?next=/admin");

  const isAdmin = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
  if (!isAdmin) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md rounded-md border bg-card p-8 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold">Admin only</h1>
          <p className="text-sm text-muted-foreground">
            Your account doesn&apos;t have permission to access this area.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-cv-primary px-4 py-2 text-sm font-semibold text-white hover:bg-cv-primary-strong"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to CouponValley
          </Link>
        </div>
      </div>
    );
  }

  const dashboard = NAV.filter((i) => !i.group);
  const grouped: Record<string, NavItem[]> = {};
  for (const item of NAV) {
    if (item.group) (grouped[item.group] ??= []).push(item);
  }

  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();
  const roleLabel = user.roles.includes("SUPER_ADMIN") ? "Super admin" : "Admin";

  return (
    <div className="grid min-h-screen grid-cols-1 bg-gradient-to-br from-cv-neutral-50 via-white to-cv-neutral-50 md:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 z-30 hidden h-screen flex-col border-r bg-white/95 backdrop-blur md:flex">
        {/* Brand block */}
        <div className="border-b bg-gradient-to-br from-cv-primary to-cv-primary-strong px-4 py-4 text-white">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/80 transition hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">CouponValley</p>
              <p className="text-[10px] uppercase tracking-widest text-white/70">
                Admin console
              </p>
            </div>
          </div>
        </div>

        {/* User chip */}
        <div className="flex items-center gap-2.5 border-b px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cv-primary to-cv-accent text-sm font-bold text-white shadow-sm">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-gray-900">
              {user.name || "Admin"}
            </p>
            <p className="truncate text-[10px] text-cv-neutral-500">{roleLabel}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label="Admin">
          <ul className="space-y-0.5">
            {dashboard.map((item) => (
              <li key={item.href}>
                <AdminNavLink {...item} />
              </li>
            ))}
          </ul>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mt-5">
              <div className="mb-1.5 flex items-center gap-2 px-2.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${
                    GROUP_ACCENTS[group] ?? "from-cv-neutral-400 to-cv-neutral-500"
                  }`}
                  aria-hidden
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cv-neutral-500">
                  {group}
                </p>
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <AdminNavLink {...item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t bg-gray-50/80 p-3">
          <LogOutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700">
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to site
        </Link>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-cv-primary" />
          <span className="text-sm font-bold">Admin</span>
        </div>
        <Link
          href="/admin"
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          aria-label="Admin home"
        >
          <LayoutGrid className="h-4 w-4" />
        </Link>
      </div>

      <main className="min-w-0 overflow-x-auto">
        <div className="container max-w-6xl px-4 py-6 sm:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t bg-white/95 px-2 py-1.5 backdrop-blur md:hidden">
        <BottomLink href="/admin" Icon={LayoutDashboard} label="Home" />
        <BottomLink href="/admin/stores" Icon={StoreIcon} label="Stores" />
        <BottomLink href="/admin/coupons" Icon={TicketPercent} label="Coupons" />
        <BottomLink href="/admin/users" Icon={Users} label="Users" />
        <BottomLink href="/admin/settings" Icon={Settings} label="More" />
      </nav>
      {/* Spacer so the mobile bottom-nav doesn't cover content */}
      <div className="h-14 md:hidden" aria-hidden />
    </div>
  );
}

function BottomLink({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-0.5 rounded-md py-1 text-[10px] font-medium text-gray-600 hover:text-cv-primary"
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
