"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  CircleCheck,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutPanelLeft,
  Link2,
  Mail,
  Megaphone,
  MousePointerClick,
  Network,
  Newspaper,
  Scale,
  Settings,
  Store as StoreIcon,
  Tag,
  TicketPercent,
  Upload,
  Users,
} from "lucide-react";

/**
 * Single sidebar nav row. Highlights when the current pathname matches the
 * link's href (exact for /admin, prefix for everything else). Each item gets
 * a coloured icon plate that intensifies on the active row.
 *
 * IMPORTANT: this is a Client Component. Server-component callers must pass
 * the icon name as a *string*, NOT the imported icon component — lucide
 * icons are `forwardRef` objects and can't cross the RSC boundary as props.
 */

// Curated icon registry. Add entries when introducing new nav items.
const ICONS = {
  dashboard: LayoutDashboard,
  homepage: LayoutPanelLeft,
  banners: ImageIcon,
  campaigns: Megaphone,
  settings: Settings,
  stores: StoreIcon,
  coupons: TicketPercent,
  upload: Upload,
  categories: Tag,
  blog: Newspaper,
  authors: Users,
  legal: Scale,
  networks: Network,
  "merchant-links": Link2,
  clicks: MousePointerClick,
  conversions: CircleCheck,
  users: BadgeCheck,
  newsletter: Mail,
} as const;

export type AdminNavIconName = keyof typeof ICONS;

export function AdminNavLink({
  href,
  label,
  iconName,
  iconBg,
  iconColor,
  badge,
}: {
  href: string;
  label: string;
  iconName: AdminNavIconName;
  iconBg: string;
  iconColor: string;
  badge?: number | string | null;
}) {
  const Icon = ICONS[iconName] ?? HelpCircle;
  const path = usePathname() ?? "";
  // Strip locale prefix (/en/admin/... → /admin/...) so active-state works
  // regardless of next-intl's URL shape.
  const normalised = path.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  const isExact = normalised === href;
  const isActive =
    isExact || (href !== "/admin" && normalised.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
        isActive
          ? "bg-gradient-to-r from-cv-primary/10 to-transparent text-cv-primary-strong ring-1 ring-inset ring-cv-primary/15"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md transition group-hover:scale-105 ${
          isActive ? "bg-cv-primary text-white shadow-sm" : `${iconBg} ${iconColor}`
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && (
        <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-600">
          {badge}
        </span>
      )}
    </Link>
  );
}
