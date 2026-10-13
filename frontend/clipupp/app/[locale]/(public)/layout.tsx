import type { ReactNode } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HomeOnly } from "@/components/site/HomeOnly";
import { CategoryRail } from "@/features/home/components/CategoryRail";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";

/**
 * The wrapper's bottom padding (below lg) reserves the fixed 64px mobile nav
 * plus the safe-area inset, so the footer's last row is never covered.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />
      <HomeOnly>
        <CategoryRail />
      </HomeOnly>
      <main id="main" className="flex-1" role="main">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
