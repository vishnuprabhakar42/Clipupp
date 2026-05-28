"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bookmark,
  History,
  LayoutDashboard,
  Settings,
  UserCircle2,
  HelpCircle,
} from "lucide-react";

const ICONS = {
  overview: LayoutDashboard,
  saved: Bookmark,
  profile: UserCircle2,
  preferences: Settings,
  history: History,
} as const;
export type AccountIconName = keyof typeof ICONS;

export function AccountNavLink({
  href,
  iconName,
  label,
  accent,
  badge,
}: {
  href: string;
  iconName: AccountIconName;
  label: ReactNode;
  accent: { bg: string; text: string };
  badge?: number | string | null;
}) {
  const path = usePathname() ?? "";
  const normalised = path.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  const isExact = normalised === href;
  const active = isExact || (href !== "/account" && normalised.startsWith(`${href}/`));
  const Icon = ICONS[iconName] ?? HelpCircle;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white shadow-sm ring-1 ring-gray-200 text-gray-900"
          : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition group-hover:scale-105 ${accent.bg} ${accent.text}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge !== 0 && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
          {badge}
        </span>
      )}
    </Link>
  );
}
