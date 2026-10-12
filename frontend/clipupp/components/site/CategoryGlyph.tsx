import {
  Flame,
  Pill,
  Play,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sofa,
  Sparkles,
  Store,
  Tag,
  Utensils,
  Plane,
  Zap,
  type LucideProps,
} from "lucide-react";
import { categoryIcon, type CategoryIcon } from "@/lib/home/categoryIcon";

const MAP: Record<CategoryIcon, React.ComponentType<LucideProps>> = {
  shirt: Shirt,
  smartphone: Smartphone,
  utensils: Utensils,
  plane: Plane,
  "shopping-cart": ShoppingCart,
  sparkles: Sparkles,
  zap: Zap,
  pill: Pill,
  play: Play,
  sofa: Sofa,
  store: Store,
  flame: Flame,
  tag: Tag,
};

/** A simple oil lamp, drawn on the same 24px grid and stroke as the lucide set. */
export function DiyaIcon({ className, strokeWidth = 1.8 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 13h18c0 4-3.6 7-9 7s-9-3-9-7z" />
      <path d="M12 3.5c1.7 2.1 2.2 3.7 0 5.5-2.2-1.8-1.7-3.4 0-5.5z" />
    </svg>
  );
}

/** Category icon for a backend or design icon name; `hot` categories get the diya. */
export function CategoryGlyph({
  name,
  hot,
  className,
}: {
  name: string | null | undefined;
  hot?: boolean;
  className?: string;
}) {
  if (hot) return <DiyaIcon className={className} />;
  const Icon = MAP[categoryIcon(name)];
  return <Icon className={className} strokeWidth={1.8} aria-hidden="true" />;
}
